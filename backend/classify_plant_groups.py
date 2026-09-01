"""전체 식물 목록을 꽃/나무/과일/건조/기타 5분류로 나눠 plant_group 컬럼에 저장.

우선순위: 나무 > 건조 > 과일 > 꽃 > 기타 (한 종이 여러 조건에 걸리면 앞쪽이 이김 —
예: 벚나무는 꽃도 피지만 "나무"로 분류하는 게 사용자 기대에 더 맞음).

227종(nongsaro/manual)은 기존 category 필드로 판별하고, 국립수목원 API로 들어온
1,500여종은 category가 없어서 v2 상세정보(description의 "[형태]" 섹션)에 있는
"교목/관목" 같은 생육형태 키워드로 판별한다 — 아직 v2 처리 안 된 종은 이 키워드가
없어서 대부분 "기타"로 남는데, v2가 계속 진행되면(fetch_forest_plant_detail.py)
재실행해서 갱신하면 된다(멱등적 — 몇 번을 다시 돌려도 안전).

사용법: python classify_plant_groups.py
"""
import re

from sqlalchemy import text

from collect_forest_plant_resource import Session

_TREE_CATEGORY = {"정원수"}
_DRY_CATEGORY = {"다육식물", "선인장다육식물"}
_FRUIT_CATEGORY = {"텃밭작물"}
_FLOWER_CATEGORY = {"꽃보기식물", "잎&꽃보기식물", "정원식물", "구근식물"}

_TREE_KEYWORDS = re.compile(r"교목|관목|떨기나무")
_DRY_KEYWORDS = re.compile(r"다육|선인장")
_FRUIT_NAME_HINTS = ("밤나무", "대추나무", "다래", "머루", "으름", "오디", "뽕나무", "감나무", "매실나무", "살구나무")

# 확실한 목본(나무) 과(科) — 장미과·콩과처럼 나무/풀 둘 다 있는 과는 제외(오분류 위험).
_TREE_FAMILIES = {
    "소나무과", "측백나무과", "주목과", "은행나무과", "참나무과", "자작나무과", "느릅나무과",
    "뽕나무과", "감나무과", "물푸레나무과", "목련과", "층층나무과", "노박덩굴과", "가래나무과",
    "버드나무과", "단풍나무과", "회양목과",
}


def classify(row: dict) -> str:
    category = row["category"] or ""
    description = row["description"] or ""
    family = row["family"] or ""
    name_kr = row["name_kr"] or ""

    if category in _TREE_CATEGORY or _TREE_KEYWORDS.search(description) or family in _TREE_FAMILIES:
        return "나무"
    if category in _DRY_CATEGORY or _DRY_KEYWORDS.search(description) or _DRY_KEYWORDS.search(name_kr):
        return "건조"
    if category in _FRUIT_CATEGORY or any(h in name_kr for h in _FRUIT_NAME_HINTS):
        return "과일"
    if category in _FLOWER_CATEGORY:
        return "꽃"
    return "기타"


def run() -> None:
    db = Session()
    try:
        rows = db.execute(text(
            "SELECT id, category, description, family, name_kr, flower_color FROM plants"
        )).mappings().all()

        counts: dict[str, int] = {}
        for row in rows:
            group = classify(row)
            counts[group] = counts.get(group, 0) + 1
            db.execute(
                text("UPDATE plants SET plant_group = :g WHERE id = :id"),
                {"g": group, "id": row["id"]},
            )
        db.commit()

        print(f"완료: {len(rows)}종 분류")
        for g, n in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"  {g}: {n}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
