"""forest_gov 출처 식물에 plantPilbkInfo(상세정보)를 개별 조회해서 재배 관련 텍스트를 채운다.

v1(2026-08-31 최초 버전)은 spft(특징)/shpe(형태)/note(비고)만 골라 썼는데, 정작
farmSpftDesc(재배특성 — 조림·풀베기·가지치기·간벌·이식 등 실제 재배법),
brdMthdDesc(번식방법), grwEvrntDesc(생육환경), useMthdDesc(이용방안),
bugInfo(병충해정보)는 응답에 있는데도 버리고 있었다 — 소나무 예시로 재배특성이
길게 나오는 걸 사용자가 직접 지적해서 발견(2026-08-31). v2는 이 필드들을 전부
라벨을 붙여 description에 합쳐 넣는다.

이미 v1으로 처리했던(혹은 민속식물 매칭으로만 description이 채워졌던) 항목도
재배 관련 텍스트가 통째로 빠져있던 상태라, "상세정보완료" 태그가 없는 forest_gov
전체를 다시 대상으로 삼는다(description 유무와 무관) — 한 번 v2로 처리되면
태그가 붙어서 재실행해도 중복 처리되지 않는다.

reqPlantPilbkNo 파라미터로 1건씩만 조회 가능해서 대량으로는 못 돌리고, data.go.kr
개발계정 일일 호출한도(1,000회) 안에서 나눠 돌려야 한다 — 예산을 넘으면 다음날
다시 실행해서 이어가면 된다.

사용법:
  python fetch_forest_plant_detail.py [예산]   # 생략 시 기본 900
"""
import sys
import time

import requests
from sqlalchemy import text

from collect_forest_plant_resource import Session, build_index, fetch_all_items, fetch_detail, normalize_sci

DEFAULT_BUDGET = 900
DONE_TAG = "상세정보완료"

# (필드, 라벨) — 이 순서대로 description에 이어붙임
DETAIL_SECTIONS = [
    ("shpe", "형태"),
    ("spft", "특징"),
    ("grwEvrntDesc", "생육환경"),
    ("farmSpftDesc", "재배특성"),
    ("brdMthdDesc", "번식방법"),
    ("useMthdDesc", "이용방안"),
    ("bugInfo", "병충해정보"),
    ("note", "비고"),
]


def build_description(detail: dict) -> str | None:
    parts = []
    for field, label in DETAIL_SECTIONS:
        value = (detail.get(field) or "").strip()
        if value:
            parts.append(f"[{label}] {value}")
    return "\n\n".join(parts) if parts else None


def run(budget: int) -> None:
    print("식물도감 목록에서 plantPilbkNo 매핑 재구성 중...")
    pilbk_index = build_index(fetch_all_items("plantPilbkSearch"), "plantSpecsScnm")
    print(f"   {len(pilbk_index)}개 학명 키")

    db = Session()
    try:
        rows = db.execute(text(
            """
            SELECT id, scientific_name, origin, name_en, tags FROM plants
            WHERE source LIKE '%forest_gov%'
              AND NOT (COALESCE(tags, ARRAY[]::varchar[]) @> ARRAY[:done_tag]::varchar[])
            """
        ), {"done_tag": DONE_TAG}).mappings().all()
        print(f"상세정보(v2) 필요한 항목: {len(rows)}건 (이번 실행 예산 {budget}건)")

        session = requests.Session()
        used = 0
        updated = 0
        failed = 0
        for row in rows:
            if used >= budget:
                print(f"예산({budget}) 소진 — 내일 다시 실행하면 이어서 처리됩니다.")
                break

            key = normalize_sci(row["scientific_name"])
            pilbk = pilbk_index.get(key)
            if not pilbk or not pilbk.get("plantPilbkNo"):
                continue

            detail = fetch_detail(pilbk["plantPilbkNo"], session=session)
            used += 1
            if not detail:
                failed += 1
                time.sleep(0.2)
                continue
            time.sleep(0.2)

            description = build_description(detail)
            updates: dict = {}
            if description:
                updates["description"] = description
            if not row["origin"] and detail.get("orplcNm"):
                updates["origin"] = detail["orplcNm"]
            if not row["name_en"] and detail.get("engNm"):
                updates["name_en"] = detail["engNm"]

            new_tags = list(row["tags"] or []) + [DONE_TAG]
            updates["tags"] = new_tags

            set_clause = ", ".join(f"{k} = :{k}" for k in updates)
            db.execute(
                text(f"UPDATE plants SET {set_clause}, updated_at = now() WHERE id = :id"),
                {**updates, "id": row["id"]},
            )
            updated += 1

            if used % 25 == 0:
                db.commit()
                print(f"  ...{used}건 조회, {updated}건 갱신, {failed}건 실패", flush=True)

        db.commit()
        print(f"\n완료: API {used}건 호출, {updated}종 상세정보(v2) 반영, {failed}건 실패")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BUDGET)
