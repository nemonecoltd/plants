"""국립수목원 API에서 아직 DB에 없는 종을 "상세정보가 실제로 있을 때만" 신규 등록.

기존 흐름(import_forest_plant_species.py로 일단 다 넣고 → fetch_forest_plant_detail.py로
나중에 상세정보 채우기)은 상세조회 전까지 이름·학명·과명만 있는 빈 껍데기 페이지가
서비스에 그대로 노출되는 문제가 있었다 — SEO에도 안 좋고 사용자 경험도 나빠서,
2026-08-31에 description 30자 미만인 2,431종을 전부 삭제했다.

이 스크립트는 그 교훈을 반영해 "조회 → 내용 있으면 등록, 없으면 스킵"을 한 번에
처리한다. 신규 후보(DB에 아직 없는 학명)에 대해 plantPilbkInfo를 먼저 조회하고,
description(형태/특징/생육환경/재배특성/번식방법/이용방안/병충해정보/비고 조합)이
30자 이상 나올 때만 INSERT — 상세정보완료 태그를 처음부터 붙여서 이후 v2 재처리
스윕(fetch_forest_plant_detail.py) 대상에서 자동 제외된다.

data.go.kr 개발계정 일일 호출한도(1,000회) 안에서 나눠 돌려야 한다.

사용법:
  python sync_forest_plant_species.py [예산]   # 생략 시 기본 900
"""
import re
import sys
import time

import requests
from sqlalchemy import text

from collect_forest_plant_resource import Session, build_index, fetch_all_items, fetch_detail, normalize_sci
from fetch_forest_plant_detail import DONE_TAG, build_description

MIN_DESCRIPTION_LEN = 30


def slugify(sci_key: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", sci_key.lower()).strip("-")
    return s or "plant"


def run(budget: int) -> None:
    print("식물도감 목록(taxonomy) 수집 중...")
    pilbk_items = fetch_all_items("plantPilbkSearch")
    pilbk_index = build_index(pilbk_items, "plantSpecsScnm")
    print(f"   {len(pilbk_items)}건 수집, {len(pilbk_index)}개 학명 키")

    naturalized_index = build_index(fetch_all_items("plantNaturalizedList"), "plantSpecsScnm")

    db = Session()
    try:
        existing_keys = {
            normalize_sci(r[0])
            for r in db.execute(text("SELECT scientific_name FROM plants")).fetchall()
            if r[0]
        }
        existing_slugs = {r[0] for r in db.execute(text("SELECT slug FROM plants")).fetchall()}

        candidates = [k for k in pilbk_index if k and k not in existing_keys]
        print(f"신규 후보 {len(candidates)}종 (기존 {len(existing_keys)}종 제외, 예산 {budget}건)")

        session = requests.Session()
        used = 0
        inserted = 0
        skipped_thin = 0
        failed = 0

        for key in candidates:
            if used >= budget:
                print(f"예산({budget}) 소진 — 내일 다시 실행하면 이어서 처리됩니다.")
                break

            pilbk = pilbk_index[key]
            plant_no = pilbk.get("plantPilbkNo")
            if not plant_no:
                continue

            detail = fetch_detail(plant_no, session=session)
            used += 1
            time.sleep(0.2)

            if not detail:
                failed += 1
                continue

            description = build_description(detail)
            if not description or len(description) < MIN_DESCRIPTION_LEN:
                skipped_thin += 1
                continue

            slug = slugify(key)
            if slug in existing_slugs:
                slug = f"{slug}-{plant_no}"
            existing_slugs.add(slug)

            natur = naturalized_index.get(key)
            scientific_name = key[0].upper() + key[1:]

            bloom_months = []
            if natur:
                for f in ("blprdStmnt", "blprdEnmnt"):
                    v = natur.get(f)
                    if v and v.isdigit() and int(v) not in bloom_months:
                        bloom_months.append(int(v))

            db.execute(
                text(
                    """
                    INSERT INTO plants
                        (slug, name_kr, name_en, scientific_name, family, origin,
                         description, bloom_months, tags, source)
                    VALUES
                        (:slug, :name_kr, :name_en, :scientific_name, :family, :origin,
                         :description, :bloom_months, :tags, 'forest_gov')
                    """
                ),
                {
                    "slug": slug,
                    "name_kr": pilbk.get("plantGnrlNm") or scientific_name,
                    "name_en": detail.get("engNm") or (natur or {}).get("plantEngNm"),
                    "scientific_name": scientific_name,
                    "family": pilbk.get("familyKorNm"),
                    "origin": detail.get("orplcNm") or (natur or {}).get("orplcNm"),
                    "description": description,
                    "bloom_months": bloom_months or None,
                    "tags": ["자생식물", DONE_TAG],
                },
            )
            inserted += 1

            if used % 25 == 0:
                db.commit()
                print(f"  ...{used}건 조회, {inserted}건 등록, {skipped_thin}건 정보부족 스킵, {failed}건 실패", flush=True)

        db.commit()
        print(f"\n완료: API {used}건 호출, {inserted}종 신규 등록, {skipped_thin}건 정보부족으로 스킵, {failed}건 실패")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 900)
