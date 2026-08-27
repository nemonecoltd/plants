"""농사로 오픈API — 실내정원 만들기 스타일(cateGardenMake) 수집 → guides 테이블.

collect_nongsaro_flwrdecor.py와 동일 패턴, 다른 서비스(같은 API 계정 키 공용).
  - cateGardenMakeLst: 목록(제목/유형 코드들/썸네일)
  - cateGardenMakeDtl: 상세(본문 HTML — 설명+단계별 사진 가이드 포함)

사용법: python collect_nongsaro_categardenmake.py [예산]
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

BASE_URL = "http://api.nongsaro.go.kr/service/cateGardenMake"


def get_xml(operation: str, params: dict) -> str:
    resp = requests.get(f"{BASE_URL}/{operation}", params={"apiKey": API_KEY, **params}, timeout=15)
    resp.raise_for_status()
    return resp.text


def extract(tag: str, xml: str) -> str:
    m = re.search(rf"<{tag}>\s*(?:<!\[CDATA\[(.*?)\]\]>)?\s*</{tag}>", xml, re.S)
    return (m.group(1) or "").strip() if m else ""


def extract_items(xml: str) -> list[str]:
    return re.findall(r"<item>(.*?)</item>", xml, re.S)


def fetch_list() -> list[dict]:
    xml = get_xml("cateGardenMakeLst", {"pageNo": 1, "numOfRows": 200})
    return [
        {
            "cntntsNo": extract("cntntsNo", it),
            "title": extract("cntntsSj", it),
            "category": extract("decorkndCodeNm", it) or None,
            "thumbnail_url": (extract("imgUrl", it) or "").replace("http://", "https://") or None,
        }
        for it in extract_items(xml)
    ]


def fetch_body(cntnts_no: str) -> str | None:
    xml = get_xml("cateGardenMakeDtl", {"cntntsNo": cntnts_no})
    item_xml = (extract_items(xml) or [""])[0]
    return extract("cn", item_xml) or None


def upsert_guide(db, guide: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO guides
                (slug, title, category, summary, materials, thumbnail_url,
                 image_urls, body, published_at, source)
            VALUES
                (:slug, :title, :category, NULL, NULL, :thumbnail_url,
                 :image_urls, :body, NULL, 'nongsaro')
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title, category = EXCLUDED.category,
                thumbnail_url = EXCLUDED.thumbnail_url, image_urls = EXCLUDED.image_urls,
                body = EXCLUDED.body, source = 'nongsaro', updated_at = now()
            """
        ),
        guide,
    )


def run(budget: int | None) -> None:
    db = Session()
    try:
        items = fetch_list()
        print(f"목록 조회: {len(items)}건")
        if budget:
            items = items[:budget]

        saved = 0
        for it in items:
            if not it["cntntsNo"] or not it["title"]:
                continue
            try:
                body = fetch_body(it["cntntsNo"])
                slug = f"nongsaro-{it['cntntsNo']}"
                guide = {
                    "slug": slug,
                    "title": it["title"],
                    "category": it["category"],
                    "thumbnail_url": it["thumbnail_url"],
                    "image_urls": [it["thumbnail_url"]] if it["thumbnail_url"] else [],
                    "body": body,
                }
                upsert_guide(db, guide)
                db.commit()
                saved += 1
                print(f"+ {it['title']} ({slug})")
            except Exception as e:
                db.rollback()
                print(f"- {it['title']}: 오류 {e}")
            time.sleep(0.15)

        print(f"완료: {saved}/{len(items)}건 저장")
    finally:
        db.close()


if __name__ == "__main__":
    budget = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(budget)
