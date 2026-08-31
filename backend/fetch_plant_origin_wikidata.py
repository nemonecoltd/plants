"""⚠️ 사용 보류(2026-08-31) — 실행하지 말 것. 아래 이유로 폐기.

Wikidata의 P9714(원산지)가 한중일 공유종에서 중국 체크리스트(Flora of China) 편향으로
채워져 있어, 소나무(Pinus densiflora, 한국 국목)조차 원산지가 "중화인민공화국,
푸젠성"으로만 나오고 한국·일본·러시아가 통째로 빠져있음(직접 테스트로 확인).
그대로 쓰면 한국 자생식물을 중국산처럼 보이게 하는 명백한 오류 데이터가 된다.
이 파일은 시도 기록 + 사유 보존용으로만 남겨둠 — DB에 실제로 반영된 적 없음.

---

Wikidata에서 학명으로 종을 찾아 원산지(P9714, native range)를 origin에 채운다.

개화시기는 Wikidata에 종 단위로 구조화된 "개화 시기" 프로퍼티가 따로 없어서
(확인 결과 위키백과 본문 서술로만 존재, 통계 클레임 아님) 이 스크립트로는
못 채운다 — 억지로 부정확한 값을 넣느니 비워두는 쪽을 택함.

절차: wbsearchentities로 학명 검색 → 상위 후보들 중 taxon name(P225)이
정확히 일치하는 걸 확인 → P9714(원산지 국가 QID 목록) 추출 → QID를
한국어 라벨로 일괄 변환(wbgetentities, 최대 50개씩 배치) → origin에 저장.

data.go.kr류 일일 호출한도는 없지만 Wikidata에 예의상 요청 간 딜레이를 둔다.

사용법:
  python fetch_plant_origin_wikidata.py [예산]   # 생략 시 기본 800
"""
import sys
import time

import requests
from sqlalchemy import text

from collect_forest_plant_resource import Session

API = "https://www.wikidata.org/w/api.php"
HEADERS = {"User-Agent": "NemonePlantsBot/0.1 (contact@nemoneai.com)"}
NATIVE_RANGE_PROP = "P9714"
TAXON_NAME_PROP = "P225"

_label_cache: dict[str, str] = {}


def find_taxon_entity(session: requests.Session, scientific_name: str) -> dict | None:
    """학명으로 후보를 검색해 taxon name(P225)이 정확히 일치하는 엔티티를 반환.
    (검색 히트마다 엔티티를 조회하므로 어차피 나중에 또 쓸 걸 여기서 받아 재사용)"""
    resp = session.get(API, params={
        "action": "wbsearchentities", "search": scientific_name, "language": "en",
        "type": "item", "limit": 5, "format": "json",
    }, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    for hit in resp.json().get("search", []):
        entity = get_entity(session, hit["id"])
        if not entity:
            continue
        taxon_claim = entity.get("claims", {}).get(TAXON_NAME_PROP)
        if not taxon_claim:
            continue
        value = taxon_claim[0]["mainsnak"].get("datavalue", {}).get("value")
        if value and value.strip().lower() == scientific_name.strip().lower():
            return entity
    return None


def get_entity(session: requests.Session, qid: str) -> dict | None:
    resp = session.get(API, params={
        "action": "wbgetentities", "ids": qid, "format": "json",
    }, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.json().get("entities", {}).get(qid)


def get_native_range_qids(entity: dict) -> list[str]:
    claims = entity.get("claims", {}).get(NATIVE_RANGE_PROP, [])
    qids = []
    for c in claims:
        value = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if isinstance(value, dict) and value.get("id"):
            qids.append(value["id"])
    return qids


def resolve_labels(session: requests.Session, qids: list[str]) -> dict[str, str]:
    todo = [q for q in qids if q not in _label_cache]
    for i in range(0, len(todo), 50):
        batch = todo[i:i + 50]
        resp = session.get(API, params={
            "action": "wbgetentities", "ids": "|".join(batch),
            "props": "labels", "languages": "ko|en", "format": "json",
        }, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        entities = resp.json().get("entities", {})
        for qid, ent in entities.items():
            labels = ent.get("labels", {})
            _label_cache[qid] = (labels.get("ko") or labels.get("en") or {}).get("value", qid)
    return {q: _label_cache.get(q, q) for q in qids}


def run(budget: int) -> None:
    db = Session()
    try:
        rows = db.execute(text(
            "SELECT id, scientific_name FROM plants "
            "WHERE (origin IS NULL OR origin = '') AND scientific_name IS NOT NULL"
        )).mappings().all()
        print(f"원산지 필요한 항목: {len(rows)}건 (이번 실행 예산 {budget}건)")

        session = requests.Session()
        used = 0
        updated = 0
        for row in rows:
            if used >= budget:
                print(f"예산({budget}) 소진 — 다시 실행하면 이어서 처리됩니다.")
                break
            used += 1

            try:
                entity = find_taxon_entity(session, row["scientific_name"])
                range_qids = get_native_range_qids(entity) if entity else []
                if not range_qids:
                    time.sleep(0.3)
                    continue
                labels = resolve_labels(session, range_qids)
                origin = ", ".join(labels[q] for q in range_qids)
            except Exception as e:
                print(f"  [{row['scientific_name']}] 오류: {e}")
                time.sleep(0.3)
                continue
            time.sleep(0.3)

            db.execute(
                text("UPDATE plants SET origin = :origin, updated_at = now() WHERE id = :id"),
                {"origin": origin, "id": row["id"]},
            )
            updated += 1

            if used % 50 == 0:
                db.commit()
                print(f"  ...{used}건 조회, {updated}건 갱신", flush=True)

        db.commit()
        print(f"\n완료: {used}건 조회, {updated}종 원산지 반영")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 800)
