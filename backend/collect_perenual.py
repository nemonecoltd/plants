"""Perenual API(https://perenual.com/docs/api)에서 식물 데이터를 가져와 plants 테이블에 upsert.

사용 전 준비:
  1. https://perenual.com/subscription-api 에서 무료 API 키 발급(가입만 하면 즉시 발급, 승인 대기 없음)
  2. backend/.env.local에 한 줄 추가: PERENUAL_API_KEY=발급받은키

사용법:
  python collect_perenual.py [예산]      # 예산 생략 시 기본 40회 API 요청

무료 tier는 하루 100요청 제한이라 예산을 넉넉히 남겨 기본 40으로 제한했다.
이미 DB에 있는 slug(scientific_name 기반)는 건너뛰므로 매일 재실행하면 이어서 채워진다.

주의(수동 확인 필요한 근사치):
  - name_kr: Perenual은 영문 데이터만 제공 — 지금은 영문 common_name을 그대로 넣어둠.
    실제 서비스 노출 전 한글명으로 교체하는 후속 작업 필요(TODO).
  - category: Perenual의 indoor 플래그만으로 관엽식물/정원식물 두 갈래로 단순 매핑한 근사치.
  - min_temp_c: Perenual이 반환하는 USDA 내한성 존(zone) 하한값을 표준 존별 섭씨 최저기온
    표(ZONE_MIN_TEMP_C)로 환산한 값 — 실측치가 아니라 존 기준 근사치.
"""
import os
import re
import sys
import time

import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")

API_KEY = os.environ.get("PERENUAL_API_KEY")
if not API_KEY:
    print("PERENUAL_API_KEY가 .env.local에 없습니다.")
    print("https://perenual.com/subscription-api 에서 무료 키 발급 후 .env.local에 추가하세요.")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

BASE_URL = "https://perenual.com/api"
DEFAULT_BUDGET = 40

WATERING_MAP = {"frequent": "wet", "average": "moderate", "minimum": "dry", "none": "dry"}
CARE_MAP = {"low": "easy", "medium": "medium", "high": "hard"}

# USDA 내한성 존별 하한 온도(°C) — 표준 존 정의(실측 아님, 존 경계 근사치)
ZONE_MIN_TEMP_C = {
    1: -51, 2: -45, 3: -40, 4: -34, 5: -29, 6: -23, 7: -18,
    8: -12, 9: -7, 10: -1, 11: 4, 12: 10, 13: 16,
}


def slugify(value: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return s or "plant"


def map_sunlight(values):
    if not values:
        return None
    joined = " ".join(values).lower()
    if "part" in joined:
        return "part_shade"
    if "full sun" in joined or joined.strip() == "sun":
        return "full_sun"
    if "shade" in joined:
        return "full_shade"
    return None


def get_json(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=15)
    if resp.status_code == 429:
        print("일일 요청 한도(429) 도달 — 내일 다시 실행하면 이어서 처리됩니다.")
        sys.exit(0)
    resp.raise_for_status()
    return resp.json()


def fetch_species_list(page: int) -> dict:
    return get_json(f"{BASE_URL}/species-list", {"key": API_KEY, "page": page})


def fetch_species_detail(species_id: int) -> dict:
    return get_json(f"{BASE_URL}/species/details/{species_id}", {"key": API_KEY})


def all_existing_slugs(db) -> set:
    rows = db.execute(text("SELECT slug FROM plants")).fetchall()
    return {r[0] for r in rows}


def upsert_plant(db, p: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO plants
                (slug, name_kr, name_en, scientific_name, category, tags,
                 planting_months, bloom_months, watering_level, sunlight,
                 soil_type, hardiness_zone, min_temp_c, difficulty,
                 description, image_urls, source)
            VALUES
                (:slug, :name_kr, :name_en, :scientific_name, :category, :tags,
                 :planting_months, :bloom_months, :watering_level, :sunlight,
                 :soil_type, :hardiness_zone, :min_temp_c, :difficulty,
                 :description, :image_urls, :source)
            ON CONFLICT (slug) DO NOTHING
            """
        ),
        p,
    )


def run(budget: int) -> None:
    db = Session()
    seen = all_existing_slugs(db)
    used = 0
    page = 1
    candidates = []

    try:
        # 1단계: species-list로 후보 수집(이미 있는 slug는 상세 조회 예산 아끼려고 미리 제외)
        while used < budget:
            data = fetch_species_list(page)
            used += 1
            species = data.get("data") or []
            if not species:
                break
            for sp in species:
                sci_list = sp.get("scientific_name") or []
                sci = ", ".join(sci_list) if sci_list else sp.get("common_name") or f"species-{sp['id']}"
                if slugify(sci) not in seen:
                    candidates.append(sp)
            if not (data.get("links") or {}).get("next"):
                break
            page += 1

        # 2단계: 후보별 상세 조회 + upsert (남은 예산만큼만)
        saved = 0
        for sp in candidates:
            if used >= budget:
                print(f"요청 예산({budget}) 소진 — 다시 실행하면 이어서 처리됩니다.")
                break

            detail = fetch_species_detail(sp["id"])
            used += 1

            sci_list = detail.get("scientific_name") or sp.get("scientific_name") or []
            sci = ", ".join(sci_list) if sci_list else detail.get("common_name") or f"species-{sp['id']}"
            slug = slugify(sci)
            if slug in seen:
                continue

            hardiness = detail.get("hardiness") or {}
            zone_raw = hardiness.get("min")
            zone_min = int(zone_raw) if str(zone_raw or "").isdigit() else None

            image = (detail.get("default_image") or {}).get("original_url")

            plant = dict(
                slug=slug,
                name_kr=detail.get("common_name") or sci,  # TODO: 한글명으로 교체 필요
                name_en=detail.get("common_name"),
                scientific_name=sci,
                category="관엽식물" if detail.get("indoor") else "정원식물",
                tags=["개화식물"] if detail.get("flowers") else [],
                planting_months=[],
                bloom_months=[],
                watering_level=WATERING_MAP.get(str(detail.get("watering") or "").lower()),
                sunlight=map_sunlight(detail.get("sunlight")),
                soil_type=detail.get("soil") or [],
                hardiness_zone=zone_min,
                min_temp_c=ZONE_MIN_TEMP_C.get(zone_min) if zone_min else None,
                difficulty=CARE_MAP.get(str(detail.get("care_level") or "").lower()),
                description=(detail.get("description") or "").strip() or None,
                image_urls=[image] if image else [],
                source="perenual",
            )
            upsert_plant(db, plant)
            db.commit()
            seen.add(slug)
            saved += 1
            time.sleep(0.3)

        print(f"완료: 이번 실행에서 {saved}종 신규 저장, API 요청 {used}회 사용(예산 {budget})")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BUDGET)
