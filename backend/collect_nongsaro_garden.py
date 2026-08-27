"""농촌진흥청 농사로 오픈API — 실내정원용 식물(garden) 수집.

승인된 서비스키 하나로 여러 데이터셋에 접근 가능(계정 단위 발급). 이 서비스는
api.nongsaro.go.kr/service/garden/{gardenList|gardenDtl} 두 오퍼레이션으로 구성:
  - gardenList: 목록 + 이미지 URL(영구 URL, Perenual과 달리 만료 없음)
  - gardenDtl:  종목별 상세(설명/물주기/광도/관리난이도/내한온도 등, cntntsNo로 조회)

나머지 4개 승인 데이터셋(꽃장식과 정원 꾸미기/실내정원만들기/좋아하는 꽃/텃밭가꾸기 정보)은
serviceName을 특정하지 못해 미포함 — data.go.kr 마이페이지에서 각 데이터셋 상세의
"참고문서"를 확인해 URL 패턴을 알려주면 이어서 추가 가능.

사용법:
  export NONGSARO_API_KEY=발급받은키   (또는 .env.local에 저장)
  python collect_nongsaro_garden.py [예산]   # 예산 생략 시 전체(217종)
"""
from __future__ import annotations

import os
import re
import sys
import time

import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")

API_KEY = os.environ.get("NONGSARO_API_KEY")
if not API_KEY:
    print("NONGSARO_API_KEY가 .env.local에 없습니다.")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

BASE_URL = "http://api.nongsaro.go.kr/service/garden"

SEASON_MONTHS = {"봄": [3, 4, 5], "여름": [6, 7, 8], "가을": [9, 10, 11], "겨울": [12, 1, 2]}


def slugify(value: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return s


def get_xml(operation: str, params: dict) -> str:
    params = {"apiKey": API_KEY, **params}
    resp = requests.get(f"{BASE_URL}/{operation}", params=params, timeout=15)
    resp.raise_for_status()
    return resp.text


def extract(tag: str, xml: str) -> str:
    m = re.search(rf"<{tag}>\s*(?:<!\[CDATA\[(.*?)\]\]>)?\s*</{tag}>", xml, re.S)
    if not m:
        return ""
    return (m.group(1) or "").strip()


def extract_items(xml: str, item_tag: str = "item") -> list[str]:
    return re.findall(rf"<{item_tag}>(.*?)</{item_tag}>", xml, re.S)


def map_watering(*codes: str) -> str | None:
    joined = " ".join(codes)
    if "촉촉하게 유지" in joined:
        return "wet"
    if "대부분 말랐을때" in joined:
        return "dry"
    if "말랐을때" in joined:
        return "moderate"
    return None


def map_sunlight(light: str) -> str | None:
    if "높은 광도" in light:
        return "full_sun"
    if "중간 광도" in light:
        return "part_shade"
    if "낮은 광도" in light:
        return "full_shade"
    return None


def map_difficulty(level: str) -> str | None:
    if "초보" in level:
        return "easy"
    if "경험" in level or "숙련" in level or "전문" in level:
        return "hard"
    if level:
        return "medium"
    return None


def parse_min_temp(text_: str) -> int | None:
    m = re.search(r"(-?\d+)\s*℃", text_)
    return int(m.group(1)) if m else None


def parse_planting_months(text_: str) -> list[int]:
    months: set[int] = set()
    for start, end in re.findall(r"(\d{1,2})\s*~\s*(\d{1,2})\s*월", text_):
        s, e = int(start), int(end)
        rng = range(s, e + 1) if s <= e else list(range(s, 13)) + list(range(1, e + 1))
        months.update(rng)
    return sorted(months)


def parse_bloom_months(season_names: str) -> list[int]:
    months: set[int] = set()
    for season, ms in SEASON_MONTHS.items():
        if season in season_names:
            months.update(ms)
    return sorted(months)


def split_list(value: str) -> list[str]:
    return [v.strip() for v in re.split(r"[,·]", value) if v.strip()]


def fetch_list(page: int, rows: int) -> list[dict]:
    xml = get_xml("gardenList", {"pageNo": page, "numOfRows": rows})
    results = []
    for item_xml in extract_items(xml):
        urls = extract("rtnFileUrl", item_xml).split("|") if extract("rtnFileUrl", item_xml) else []
        seq = extract("rtnImgSeCode", item_xml).split("|")
        # REPR(대표) 이미지 우선, 없으면 첫 번째
        image = next((u for u, s in zip(urls, seq) if "REPR" in u), (urls[0] if urls else None))
        results.append({
            "cntntsNo": extract("cntntsNo", item_xml),
            "name": extract("cntntsSj", item_xml),
            "image": image,
        })
    return results


def fetch_detail(cntnts_no: str) -> dict:
    xml = get_xml("gardenDtl", {"cntntsNo": cntnts_no})
    item_xml = (extract_items(xml, "item") or [""])[0]
    g = lambda tag: extract(tag, item_xml)  # noqa: E731

    watering = map_watering(
        g("watercycleSprngCodeNm"), g("watercycleSummerCodeNm"),
        g("watercycleAutumnCodeNm"), g("watercycleWinterCodeNm"),
    )
    tags = [t.strip() for t in g("adviseInfo").split(",") if t.strip()]

    return {
        "name_en": g("plntzrNm") or None,
        "scientific_name": g("plntbneNm") or None,
        "category": (g("clCodeNm").split(",")[0] if g("clCodeNm") else None),
        "tags": tags,
        "planting_months": parse_planting_months(g("prpgtEraInfo")),
        "bloom_months": parse_bloom_months(g("fmldeSeasonCodeNm")),
        "watering_level": watering,
        "sunlight": map_sunlight(g("lighttdemanddoCodeNm")),
        "soil_type": [g("soilInfo")] if g("soilInfo") else [],
        "min_temp_c": parse_min_temp(g("winterLwetTpCodeNm")),
        "difficulty": map_difficulty(g("managelevelCodeNm")),
        "description": g("fncltyInfo") or None,
        # 모두의농업(같은 농사로 데이터를 재노출하는 사이트) 비교로 발견한 추가 필드 —
        # 초기 수집기가 케어 카드 6개 필드만 옮기고 누락했던 것을 보완(2026-08-27)
        "family": g("fmlCodeNm") or None,
        "origin": g("orgplceInfo") or None,
        "growth_form": g("grwhstleCodeNm") or None,
        "leaf_color": split_list(g("lefcolrCodeNm")),
        "flower_color": split_list(g("flclrCodeNm")),
        "fruit_color": split_list(g("fmldecolrCodeNm")),
        "leaf_pattern": g("lefmrkCodeNm") or None,
        "leaf_style": g("lefStleInfo") or None,
        "propagation_methods": split_list(g("prpgtmthCodeNm")),
        "pests": split_list(g("dlthtsCodeNm")),
        "toxicity": g("toxctyInfo") or None,
    }


def upsert_plant(db, p: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO plants
                (slug, name_kr, name_en, scientific_name, category, tags,
                 planting_months, bloom_months, watering_level, sunlight,
                 soil_type, hardiness_zone, min_temp_c, difficulty,
                 description, image_urls, family, origin, growth_form,
                 leaf_color, flower_color, fruit_color, leaf_pattern, leaf_style,
                 propagation_methods, pests, toxicity, source)
            VALUES
                (:slug, :name_kr, :name_en, :scientific_name, :category, :tags,
                 :planting_months, :bloom_months, :watering_level, :sunlight,
                 :soil_type, NULL, :min_temp_c, :difficulty,
                 :description, :image_urls, :family, :origin, :growth_form,
                 :leaf_color, :flower_color, :fruit_color, :leaf_pattern, :leaf_style,
                 :propagation_methods, :pests, :toxicity, 'nongsaro')
            ON CONFLICT (slug) DO UPDATE SET
                name_kr = EXCLUDED.name_kr, name_en = EXCLUDED.name_en,
                scientific_name = EXCLUDED.scientific_name, category = EXCLUDED.category,
                tags = EXCLUDED.tags, planting_months = EXCLUDED.planting_months,
                bloom_months = EXCLUDED.bloom_months, watering_level = EXCLUDED.watering_level,
                sunlight = EXCLUDED.sunlight, soil_type = EXCLUDED.soil_type,
                min_temp_c = EXCLUDED.min_temp_c, difficulty = EXCLUDED.difficulty,
                description = EXCLUDED.description, image_urls = EXCLUDED.image_urls,
                family = EXCLUDED.family, origin = EXCLUDED.origin,
                growth_form = EXCLUDED.growth_form, leaf_color = EXCLUDED.leaf_color,
                flower_color = EXCLUDED.flower_color, fruit_color = EXCLUDED.fruit_color,
                leaf_pattern = EXCLUDED.leaf_pattern, leaf_style = EXCLUDED.leaf_style,
                propagation_methods = EXCLUDED.propagation_methods, pests = EXCLUDED.pests,
                toxicity = EXCLUDED.toxicity,
                source = 'nongsaro', updated_at = now()
            """
        ),
        p,
    )


def run(budget: int | None) -> None:
    db = Session()
    try:
        items = fetch_list(1, 500)
        print(f"목록 조회: {len(items)}종")
        if budget:
            items = items[:budget]

        saved = 0
        for it in items:
            if not it["cntntsNo"] or not it["name"]:
                continue
            try:
                detail = fetch_detail(it["cntntsNo"])
                base = detail.get("scientific_name") or it["name"]
                slug = slugify(base) or f"nongsaro-{it['cntntsNo']}"
                plant = {
                    "slug": slug,
                    "name_kr": it["name"],
                    "image_urls": [it["image"]] if it["image"] else [],
                    **detail,
                }
                upsert_plant(db, plant)
                db.commit()
                saved += 1
                print(f"+ {it['name']} ({slug})")
            except Exception as e:
                db.rollback()
                print(f"- {it['name']}: 오류 {e}")
            time.sleep(0.15)

        print(f"완료: {saved}/{len(items)}종 저장")
    finally:
        db.close()


if __name__ == "__main__":
    budget = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(budget)
