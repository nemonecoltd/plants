"""산림청 국립수목원 식물자원 조회 서비스(data.go.kr, 서비스ID 1400119)로 plants 테이블을 보강.

사용 전 준비:
  backend/.env.local에 FOREST_PLANT_API_KEY=발급받은키 (이미 추가돼 있음)

사용법:
  python collect_forest_plant_resource.py

동작 방식(신규 생성이 아니라 "보강"):
  이미 DB에 있는 227종을 학명(genus+species, 저자인용 제외)으로 매칭해서
  family(과명이 비어있을 때만) / origin(외래식물 목록에 있을 때만) /
  name_en(비어있을 때만) / bloom_months(비어있을 때만, 외래식물목록의 개화시기) /
  description(비어있을 때만, 민속식물 식별설명)을 채운다. 이미 값이 있는 필드는
  절대 덮어쓰지 않는다 — 기존 nongsaro/manual 데이터가 더 정제된 경우가 많아서.

  자료 출처가 이 API인 항목은 source 필드에 ",forest_gov"를 덧붙여 표시해두고,
  프론트(app/plants/[slug]/page.tsx)에서 이 표시를 보고 광고/제휴상품을 숨기고
  출처 문구만 노출한다 — 이 API 라이선스(공공저작물 제4유형)가 상업적 이용을
  금지하고 있어서, 해당 데이터가 섞인 페이지만이라도 광고 노출 없이 출처표시로
  대응하기로 함(2026-08-31, 리스크 인지 후 진행하기로 결정).

  totalCount가 4458/434/896 정도라 전부 합쳐도 API 호출 10회 내외 — 개발계정
  일일 한도(1,000회)와 무관하게 매번 전체 재수집해도 무방.
"""
import os
import re
import sys
import time
import xml.etree.ElementTree as ET

import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")

API_KEY = os.environ.get("FOREST_PLANT_API_KEY")
if not API_KEY:
    print("FOREST_PLANT_API_KEY가 .env.local에 없습니다.")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

BASE_URL = "https://apis.data.go.kr/1400119/PlantResource"


def normalize_sci(raw: str | None) -> str:
    """저자인용·품종명을 떼고 '속명 종소명'(잡종이면 × 포함 3토큰)만 남겨 매칭키로 사용."""
    if not raw:
        return ""
    tokens = raw.strip().split()
    if not tokens:
        return ""
    if len(tokens) >= 3 and tokens[1] in ("×", "x", "X"):
        core = tokens[:3]
    else:
        core = tokens[:2]
    return " ".join(core).lower().replace("×", "x").strip("'\"")


def fetch_all_items(operation: str, page_size: int = 1000) -> list[dict]:
    """페이지네이션 돌며 전체 item을 dict 리스트로 반환(XML 파싱, type 파라미터는 무시되고 항상 XML로 옴)."""
    items = []
    page = 1
    while True:
        resp = requests.get(
            f"{BASE_URL}/{operation}",
            params={"serviceKey": API_KEY, "pageNo": page, "numOfRows": page_size},
            timeout=30,
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        result_code = root.findtext(".//resultCode")
        if result_code != "00":
            print(f"  [{operation}] API 에러: {root.findtext('.//resultMsg')}")
            break

        page_items = root.findall(".//item")
        for item in page_items:
            items.append({child.tag: (child.text or "").strip() for child in item})

        total_count = int(root.findtext(".//totalCount") or 0)
        if not page_items or len(items) >= total_count:
            break
        page += 1
    return items


def fetch_detail(plant_pilbk_no: str, retries: int = 2, session: requests.Session | None = None) -> dict | None:
    """plantPilbkInfo 상세조회 — 파라미터명이 응답 필드명(plantPilbkNo)이 아니라
    'req'+필드명(reqPlantPilbkNo)이라는 걸 몰라서 한동안 계속 빈 응답만 받았다.
    실제 활용 예제 URL(reqSearchWrd)을 보고서야 이 규칙(req 접두사)을 확인함(2026-08-31).

    900건 연속 호출 중 커넥션 타임아웃으로 중간에 죽은 적이 있고, 그 다음엔 재시도
    타임아웃(15s)×횟수(3)+백오프가 너무 길어서(최악 약 52초/건) 10분 넘게 돌려도
    체크포인트(200건)에 못 미치는 일이 있었다(2026-08-31) — timeout을 줄이고
    retries도 2회로 낮춰 건당 최악 대기시간을 크게 단축. 그래도 실패하면 이 항목만
    건너뛰고 None 반환(다음 실행 때 description이 비어있으니 자동 재시도됨)."""
    req = session or requests
    for attempt in range(retries):
        try:
            resp = req.get(
                f"{BASE_URL}/plantPilbkInfo",
                params={"serviceKey": API_KEY, "reqPlantPilbkNo": plant_pilbk_no},
                timeout=(5, 8),
            )
            resp.raise_for_status()
            root = ET.fromstring(resp.content)
            if root.findtext(".//resultCode") != "00":
                return None
            item = root.find(".//item")
            if item is None:
                return None
            return {child.tag: (child.text or "").strip() for child in item}
        except (requests.exceptions.RequestException, ET.ParseError):
            if attempt == retries - 1:
                return None
            time.sleep(1)
    return None


def build_index(items: list[dict], sci_field: str) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for it in items:
        key = normalize_sci(it.get(sci_field))
        if key and key not in index:
            index[key] = it
    return index


def run() -> None:
    print("1/3 식물도감 목록(taxonomy) 수집 중...")
    pilbk_items = fetch_all_items("plantPilbkSearch")
    pilbk_index = build_index(pilbk_items, "plantSpecsScnm")
    print(f"   {len(pilbk_items)}건 수집, {len(pilbk_index)}개 학명 키")

    print("2/3 외래식물 목록(원산지·영문명·개화시기) 수집 중...")
    naturalized_items = fetch_all_items("plantNaturalizedList")
    naturalized_index = build_index(naturalized_items, "plantSpecsScnm")
    print(f"   {len(naturalized_items)}건 수집, {len(naturalized_index)}개 학명 키")

    print("3/3 민속식물 목록(식별설명) 수집 중...")
    folk_items = fetch_all_items("plantFolkSearch")
    folk_index = build_index(folk_items, "plantSpecsScnm")
    print(f"   {len(folk_items)}건 수집, {len(folk_index)}개 학명 키")

    db = Session()
    try:
        rows = db.execute(text(
            "SELECT id, scientific_name, family, origin, name_en, description, bloom_months, source FROM plants"
        )).mappings().all()

        stats = {"family": 0, "origin": 0, "name_en": 0, "description": 0, "bloom_months": 0, "matched_plants": 0}

        for row in rows:
            key = normalize_sci(row["scientific_name"])
            if not key:
                continue

            pilbk = pilbk_index.get(key)
            natur = naturalized_index.get(key)
            folk = folk_index.get(key)
            if not (pilbk or natur or folk):
                continue

            updates: dict = {}

            if not row["family"]:
                family = (pilbk or {}).get("familyKorNm") or (natur or {}).get("familyKorNm")
                if family:
                    updates["family"] = family

            if not row["origin"] and natur and natur.get("orplcNm"):
                updates["origin"] = natur["orplcNm"]

            if not row["name_en"] and natur and natur.get("plantEngNm"):
                updates["name_en"] = natur["plantEngNm"]

            if not row["bloom_months"] and natur:
                start, end = natur.get("blprdStmnt"), natur.get("blprdEnmnt")
                months = []
                if start and start.isdigit():
                    months.append(int(start))
                if end and end.isdigit() and int(end) != (months[0] if months else -1):
                    months.append(int(end))
                if months:
                    updates["bloom_months"] = months

            if not row["description"] and folk and folk.get("flcstPlantIdntfDscrt"):
                updates["description"] = folk["flcstPlantIdntfDscrt"]

            if not updates:
                continue

            current_source = row["source"] or ""
            if "forest_gov" not in current_source:
                updates["source"] = f"{current_source},forest_gov" if current_source else "forest_gov"

            set_clause = ", ".join(f"{k} = :{k}" for k in updates)
            db.execute(
                text(f"UPDATE plants SET {set_clause}, updated_at = now() WHERE id = :id"),
                {**updates, "id": row["id"]},
            )
            stats["matched_plants"] += 1
            for f in ("family", "origin", "name_en", "description", "bloom_months"):
                if f in updates:
                    stats[f] += 1

        db.commit()
        print(f"\n완료: {stats['matched_plants']}종 보강됨")
        print(f"  family: {stats['family']}, origin: {stats['origin']}, name_en: {stats['name_en']}, "
              f"description: {stats['description']}, bloom_months: {stats['bloom_months']}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
