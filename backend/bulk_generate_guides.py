"""가드닝팁 30편 일괄 생성 — /admin의 AI 초안 생성과 동일한 파이프라인을
스크립트로 반복 실행. 검색 유입 확보가 급해 관리자 화면에서 한 편씩 누르는
대신 한 번에 발행한다(품질 검수는 사후에 /admin 편집 화면에서 가능).

사용법: python3 bulk_generate_guides.py [--dry-run]
"""
from __future__ import annotations

import sys
import time
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")

import os  # noqa: E402

from ai_content_service import generate_guide_draft  # noqa: E402
from content_utils import dedupe_slug, strip_leading_h1, to_html  # noqa: E402
from generate_thumbnail import generate_thumbnail  # noqa: E402

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
_KST = timezone(timedelta(hours=9))

# 기존 가드닝팁 태그(과습/물주기/빛/영양/통풍/문제해결)와 맞물리는 "증상" 중심
# 키워드 — 종이 아니라 증상으로 묶어야 사진진단 등 향후 기능과도 연결하기 좋음.
# 이미 있는 3편(물주기 시간대/장마철/잎노랑)과 겹치지 않게 구성.
TOPICS = [
    "화분 물주기 신호 확인하는 법, 겉흙 속흙 판단 기준",
    "잎 끝이 갈색으로 마르는 이유와 대처법",
    "화분에서 냄새나는 이유, 뿌리썩음 의심 신호",
    "화분에 날파리 생기는 이유와 없애는 법",
    "깍지벌레 없애는 법, 식물 해충 대처법",
    "응애 생겼을 때 대처법, 잎 뒷면 점 확인하는 법",
    "다육식물 웃자람(도장) 방지하는 법",
    "잎에 하얀 가루 생기는 이유, 흰가루병 대처법",
    "화분 분갈이 시기 신호, 뿌리 확인하는 법",
    "겨울철 실내 식물 관리법, 난방 환경 대처",
    "에어컨 바람이 식물에 안 좋은 이유와 위치 잡는 법",
    "화분에서 새 잎이 안 나는 이유",
    "잎이 축 처지는 이유, 과습과 건조 구별법",
    "화분 배수 안 될 때 대처법, 배수구 막힘 해결",
    "스킨답서스 물꽂이로 번식시키는 법",
    "몬스테라 잎에 구멍이 안 생기는 이유",
    "다육식물 잎이 떨어지는 이유",
    "선인장 무름병 대처법, 초기 증상 구별하는 법",
    "식물 영양제 비료 주는 시기와 방법",
    "가습기 없이 실내 습도 올리는 법, 식물 습도 관리",
    "화분 흙에 곰팡이 생겼을 때 대처법",
    "여행 갈 때 화분 물주기 해결하는 법",
    "식물 잎 먼지 닦아주는 이유와 올바른 방법",
    "새로 산 식물 화분 옮겨심는 법, 분갈이 방법",
    "빛이 부족한 집에서 식물 키우는 법",
    "식물 가지치기 전정 시기와 방법",
    "화분 크기 고르는 법, 뿌리 상태별 기준",
    "잎이 노랗게 변하다 떨어지는 이유, 낙엽과 병 구별",
    "식물 뿌리 썩었을 때 살리는 법",
    "여름철 베란다 식물 관리 포인트",
]


def resolve_thumbnail(slug: str, title: str, category: str) -> str | None:
    from content_utils import GUIDES_IMAGE_DIR

    out_path = GUIDES_IMAGE_DIR / f"{slug}.png"
    if not out_path.exists():
        try:
            generate_thumbnail(slug, title, category)
        except Exception as e:
            print(f"  (썸네일 생성 실패: {e})")
    return f"/images/guides/{slug}.png" if out_path.exists() else None


def publish(db, draft: dict) -> str:
    slug = dedupe_slug(draft["slug"], db)
    _, body_md_stripped = strip_leading_h1(draft["body_markdown"])
    html = to_html(body_md_stripped)
    thumbnail_url = resolve_thumbnail(slug, draft["title"], draft["category"])

    db.execute(
        text(
            """
            INSERT INTO guides (slug, title, category, summary, thumbnail_url, body, body_md, tags, published_at, source, is_hero)
            VALUES (:slug, :title, :category, :summary, :thumbnail_url, :body, :body_md, :tags, :published_at, 'original', false)
            """
        ),
        {
            "slug": slug,
            "title": draft["title"],
            "category": draft["category"],
            "summary": draft["summary"],
            "thumbnail_url": thumbnail_url,
            "body": html,
            "body_md": draft["body_markdown"],
            "tags": draft["tags"],
            "published_at": datetime.now(_KST),
        },
    )
    db.commit()
    return slug


def run(dry_run: bool = False) -> None:
    db = Session()
    ok, failed = 0, []
    try:
        for i, topic in enumerate(TOPICS, 1):
            print(f"[{i}/{len(TOPICS)}] {topic}")
            try:
                draft = generate_guide_draft(topic)
                if dry_run:
                    print(f"  -> (dry-run) {draft['title']} ({draft['slug']})")
                else:
                    slug = publish(db, draft)
                    print(f"  -> 발행됨: {draft['title']} ({slug})")
                ok += 1
            except Exception as e:
                print(f"  !! 실패: {e}")
                failed.append(topic)
            time.sleep(1)  # API 레이트리밋 여유
    finally:
        db.close()

    print(f"\n완료: {ok}/{len(TOPICS)}건 성공")
    if failed:
        print("실패한 주제:")
        for t in failed:
            print(f"  - {t}")


if __name__ == "__main__":
    run(dry_run="--dry-run" in sys.argv)
