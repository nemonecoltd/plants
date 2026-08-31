"""국립수목원 식물자원 조회 서비스(data.go.kr, 1400119)로 plants 테이블에 신규 종을 추가.

collect_forest_plant_resource.py는 "이미 있는 227종"의 빈 칸만 채우는 보강용이고,
이 스크립트는 그와 별개로 "DB 자체가 얇다"는 문제를 풀기 위해 아직 없는 종을
새로 INSERT한다. plantPilbkSearch(식물도감, 4,458건 — 중복 학명 정리하면
약 3,900여종)를 기준 목록으로 쓰고, plantNaturalizedList(원산지·영문명·개화시기)와
plantFolkSearch(식별설명)에 매칭되면 그 값도 같이 채운다.

주의:
  - 사진이 없다(이 API는 이미지 필드를 제공하지 않음) — 상세페이지는 사진 없이도
    깨지지 않게 돼 있지만(image가 없으면 그냥 이미지 블록을 건너뜀), 시각적으로
    부실해 보일 수 있다는 점은 감안 필요.
  - 대부분 한국 자생/야생식물이라 실내 관엽식물 위주였던 기존 227종과 결이 다르다
    (예: 습지식물, 잡초성 초본 등도 대량 포함).
  - 신규 삽입 항목은 source='forest_gov'로 저장 — app/plants/[slug]/page.tsx가
    이 값을 보고 광고·쿠팡 제휴상품을 자동으로 숨기고 출처표시만 노출한다
    (상업적 이용금지 라이선스 대응, 2026-08-31).

사용법:
  python import_forest_plant_species.py [최대삽입수]   # 생략 시 전체
"""
import re
import sys

from sqlalchemy import text

from collect_forest_plant_resource import Session, build_index, fetch_all_items, normalize_sci


def slugify(sci_key: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", sci_key.lower()).strip("-")
    return s or "plant"


def run(limit: int | None) -> None:
    print("1/3 식물도감 목록(taxonomy) 수집 중...")
    pilbk_items = fetch_all_items("plantPilbkSearch")
    pilbk_index = build_index(pilbk_items, "plantSpecsScnm")
    print(f"   {len(pilbk_items)}건 수집, {len(pilbk_index)}개 학명 키")

    print("2/3 외래식물 목록(원산지·영문명·개화시기) 수집 중...")
    naturalized_index = build_index(fetch_all_items("plantNaturalizedList"), "plantSpecsScnm")

    print("3/3 민속식물 목록(식별설명) 수집 중...")
    folk_index = build_index(fetch_all_items("plantFolkSearch"), "plantSpecsScnm")

    db = Session()
    try:
        existing_keys = {
            normalize_sci(r[0])
            for r in db.execute(text("SELECT scientific_name FROM plants")).fetchall()
            if r[0]
        }
        existing_slugs = {r[0] for r in db.execute(text("SELECT slug FROM plants")).fetchall()}

        new_keys = [k for k in pilbk_index if k and k not in existing_keys]
        print(f"\n신규 후보 {len(new_keys)}종 (기존 {len(existing_keys)}종 제외)")
        if limit:
            new_keys = new_keys[:limit]
            print(f"이번 실행은 {limit}종으로 제한")

        inserted = 0
        for key in new_keys:
            pilbk = pilbk_index[key]
            slug = slugify(key)
            if slug in existing_slugs:
                slug = f"{slug}-{pilbk.get('plantPilbkNo', '')}"
            existing_slugs.add(slug)

            natur = naturalized_index.get(key)
            folk = folk_index.get(key)

            # 표시용 학명은 저자인용 뺀 "속명 종소명"(기존 227종과 동일한 표기 관례)
            scientific_name = key[0].upper() + key[1:] if key else None

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
                    "name_en": (natur or {}).get("plantEngNm"),
                    "scientific_name": scientific_name,
                    "family": pilbk.get("familyKorNm"),
                    "origin": (natur or {}).get("orplcNm"),
                    "description": (folk or {}).get("flcstPlantIdntfDscrt") or None,
                    "bloom_months": bloom_months or None,
                    "tags": ["자생식물"],
                },
            )
            inserted += 1
            if inserted % 500 == 0:
                db.commit()
                print(f"  ...{inserted}종 삽입")

        db.commit()
        print(f"\n완료: {inserted}종 신규 삽입")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
