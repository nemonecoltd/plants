"""농사로 오픈API — 텃밭가꾸기 정보(fildMnfct) 수집 → guides 테이블.

data.go.kr에서 받은 참고문서(fildMnfct.zip) 샘플소스로 확인한 엔드포인트:
  - fildMnfct/fildMnfctList: 목록 API인데 본문(cn)까지 통째로 포함돼 있어
    상세(View) 호출이 따로 필요 없음(preferenceFlower와 동일 패턴)
  - sSeCode로 카테고리 구분: 335001=채소(102건), 335002=과수(36건), 335003=인삼약초버섯(7건)

우리 관상용 식물 DB(garden/flwrDecor/cateGardenMake/preferenceFlower)와는 별개로
채소·과수·약초 등 텃밭 작물 재배법을 다루는 데이터라 신규 카테고리로 추가.

사용법: python collect_nongsaro_fildmnfct.py [예산]
"""
from __future__ import annotations

import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta

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

BASE_URL = "http://api.nongsaro.go.kr/service/fildMnfct"
_KST = timezone(timedelta(hours=9))

CATEGORIES = {"335001": "채소", "335002": "과수", "335003": "인삼약초버섯"}


def extract(tag: str, xml: str) -> str:
    m = re.search(rf"<{tag}>\s*(?:<!\[CDATA\[(.*?)\]\]>)?\s*</{tag}>", xml, re.S)
    return (m.group(1) or "").strip() if m else ""


def extract_items(xml: str) -> list[str]:
    return re.findall(r"<item>(.*?)</item>", xml, re.S)


def first_image(html: str) -> str | None:
    m = re.search(r'<img[^>]+src="([^"]+)"', html)
    return m.group(1).replace("http://", "https://") if m else None


def parse_published_at(svc_dtx: str) -> datetime | None:
    try:
        return datetime.strptime(svc_dtx, "%Y-%m-%d").replace(tzinfo=_KST)
    except ValueError:
        return None


def fetch_category(se_code: str) -> list[dict]:
    resp = requests.get(
        f"{BASE_URL}/fildMnfctList",
        params={"apiKey": API_KEY, "pageNo": 1, "numOfRows": 200, "sSeCode": se_code},
        timeout=15,
    )
    resp.raise_for_status()
    items = []
    for it in extract_items(resp.text):
        body = extract("cn", it)
        items.append({
            "cntntsNo": extract("cntntsNo", it),
            "title": extract("cntntsSj", it).strip(),
            "body": body,
            "svcDtx": extract("svcDtx", it),
        })
    return items


def upsert_guide(db, guide: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO guides
                (slug, title, category, summary, materials, thumbnail_url,
                 image_urls, body, published_at, source)
            VALUES
                (:slug, :title, :category, NULL, NULL, :thumbnail_url,
                 :image_urls, :body, :published_at, 'nongsaro')
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title, category = EXCLUDED.category,
                thumbnail_url = EXCLUDED.thumbnail_url, image_urls = EXCLUDED.image_urls,
                body = EXCLUDED.body, published_at = EXCLUDED.published_at,
                source = 'nongsaro', updated_at = now()
            """
        ),
        guide,
    )


def run(budget: int | None) -> None:
    db = Session()
    try:
        saved = 0
        total_items = 0
        for se_code, category in CATEGORIES.items():
            items = fetch_category(se_code)
            print(f"[{category}] 목록 조회: {len(items)}건")
            total_items += len(items)
            if budget:
                items = items[: max(0, budget - saved)]

            for it in items:
                if not it["cntntsNo"] or not it["title"]:
                    continue
                try:
                    slug = f"nongsaro-fm-{it['cntntsNo']}"
                    guide = {
                        "slug": slug,
                        "title": it["title"],
                        "category": category,
                        "thumbnail_url": first_image(it["body"]),
                        "image_urls": [first_image(it["body"])] if first_image(it["body"]) else [],
                        "body": it["body"] or None,
                        "published_at": parse_published_at(it["svcDtx"]),
                    }
                    upsert_guide(db, guide)
                    db.commit()
                    saved += 1
                    print(f"+ {it['title']} ({slug})")
                except Exception as e:
                    db.rollback()
                    print(f"- {it['title']}: 오류 {e}")
                time.sleep(0.15)

                if budget and saved >= budget:
                    break
            if budget and saved >= budget:
                break

        print(f"완료: {saved}/{total_items}건 저장")
    finally:
        db.close()


if __name__ == "__main__":
    budget = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(budget)
