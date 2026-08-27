"""농사로 오픈API — 색상으로 알아보는 선호꽃 효과(preferenceFlower) 수집 → guides 테이블.

목록 응답 자체에 필요한 정보가 다 있어(colorInfo/effectInfo/eraInfo/spceInfo/imgUrl)
상세(Dtl) 호출이 따로 필요 없음 — 7건뿐이라 통째로 한 번에 처리.

사용법: python collect_nongsaro_preferenceflower.py
"""
from __future__ import annotations

import os
import re
import sys

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

BASE_URL = "http://api.nongsaro.go.kr/service/preferenceFlower"


def extract(tag: str, xml: str) -> str:
    m = re.search(rf"<{tag}>\s*(?:<!\[CDATA\[(.*?)\]\]>)?\s*</{tag}>", xml, re.S)
    return (m.group(1) or "").strip() if m else ""


def extract_items(xml: str) -> list[str]:
    return re.findall(r"<item>(.*?)</item>", xml, re.S)


def fetch_list() -> list[dict]:
    resp = requests.get(f"{BASE_URL}/preferenceFlowerList", params={"apiKey": API_KEY, "pageNo": 1, "numOfRows": 50}, timeout=15)
    resp.raise_for_status()
    items = []
    for it in extract_items(resp.text):
        color = extract("colorInfo", it)
        items.append({
            "dataNo": extract("dataNo", it),
            "color": color,
            "effect": extract("effectInfo", it) or None,
            "era": extract("eraInfo", it) or None,
            "space": extract("spceInfo", it) or None,
            "thumbnail_url": (extract("imgUrl", it) or "").replace("http://", "https://") or None,
        })
    return items


def run() -> None:
    db = Session()
    try:
        items = fetch_list()
        print(f"목록 조회: {len(items)}건")

        saved = 0
        for it in items:
            if not it["dataNo"] or not it["color"]:
                continue
            slug = f"nongsaro-pref-{it['dataNo']}"
            title = f"{it['color']} 꽃의 효과"
            body_parts = []
            if it["effect"]:
                body_parts.append(f"<p><strong>효과</strong>: {it['effect']}</p>")
            if it["era"]:
                body_parts.append(f"<p><strong>어울리는 계절</strong>: {it['era']}</p>")
            if it["space"]:
                body_parts.append(f"<p><strong>추천 공간</strong>: {it['space']}</p>")

            db.execute(
                text(
                    """
                    INSERT INTO guides
                        (slug, title, category, summary, materials, thumbnail_url,
                         image_urls, body, published_at, source)
                    VALUES
                        (:slug, :title, '색상별 선호 꽃', :summary, NULL, :thumbnail_url,
                         :image_urls, :body, NULL, 'nongsaro')
                    ON CONFLICT (slug) DO UPDATE SET
                        title = EXCLUDED.title, summary = EXCLUDED.summary,
                        thumbnail_url = EXCLUDED.thumbnail_url, image_urls = EXCLUDED.image_urls,
                        body = EXCLUDED.body, source = 'nongsaro', updated_at = now()
                    """
                ),
                {
                    "slug": slug,
                    "title": title,
                    "summary": it["effect"],
                    "thumbnail_url": it["thumbnail_url"],
                    "image_urls": [it["thumbnail_url"]] if it["thumbnail_url"] else [],
                    "body": "\n".join(body_parts) or None,
                },
            )
            db.commit()
            saved += 1
            print(f"+ {title} ({slug})")

        print(f"완료: {saved}/{len(items)}건 저장")
    finally:
        db.close()


if __name__ == "__main__":
    run()
