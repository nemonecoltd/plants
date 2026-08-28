"""자체 제작 가드닝팁 발행 — backend/content/guides/*.md 를 guides 테이블로 동기화.

농사로 수집분(source='nongsaro')은 제목이 "습지형 바닥 플랜터(대형) 정원 만들기"처럼
사람들이 실제로 검색하는 말과 거리가 있어 롱테일 유입이 안 잡힌다. 그래서 검색어를
그대로 제목으로 쓰는 자체 글을 source='original'로 따로 쌓는다.

별도 CMS를 두지 않고 마크다운 파일 + 이 스크립트로 처리하는 이유:
  - 글이 git에 남아 버전 관리·리뷰가 됨
  - 인증/업로드 UI를 만들 필요가 없음
  - 기존 수집기(collect_nongsaro_*.py)와 동일한 운영 방식

맛매치 어드민과 같은 결과를 내도록, 파일 맨 앞 H1은 제목으로 올리고 본문에서는 뺀다.

사용법: python import_guides.py [--dry-run]
"""
from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import markdown as md
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

CONTENT_DIR = Path(__file__).parent / "content" / "guides"
_KST = timezone(timedelta(hours=9))

# 자체 글임을 나타내는 값 — 수집분(nongsaro)과 섞이지 않게 하고,
# 프론트에서 출처 표기/구조화데이터를 다르게 주는 기준이 된다.
SOURCE = "original"


def parse_front_matter(raw: str) -> tuple[dict, str]:
    """파일 상단 --- 블록을 메타데이터로 분리. 없으면 빈 dict."""
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, raw

    meta: dict = {}
    for line in raw[3:end].strip().splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        # tags: [물주기, 여름] 형태를 리스트로
        if value.startswith("[") and value.endswith("]"):
            meta[key] = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key] = value
    body = raw[end + 4:].lstrip("\n")
    return meta, body


def strip_leading_h1(body: str) -> tuple[str | None, str]:
    """맨 앞 H1을 제목으로 뽑고 본문에서 제거 — 제목이 화면에 두 번 나오는 것 방지.
    본문 중간의 H1은 실제 소제목일 수 있으므로 건드리지 않는다(맛매치 어드민과 동일 규칙)."""
    lines = body.lstrip("\n").splitlines()
    if lines and re.match(r"^#\s+\S", lines[0]):
        title = lines[0].lstrip("#").strip()
        rest = lines[1:]
        while rest and not rest[0].strip():
            rest.pop(0)
        return title, "\n".join(rest)
    return None, body


def to_html(body_md: str) -> str:
    # tables: 비교표(예: 계절별 물주기 차이)를 쓰기 위해 필요
    # nl2br 없이 — 마크다운 표준대로 빈 줄로 문단을 나눈다
    return md.markdown(body_md, extensions=["tables", "sane_lists", "attr_list"])


def parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=_KST)
    except ValueError:
        return None


def upsert(db, guide: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO guides
                (slug, title, category, summary, thumbnail_url, body, tags, published_at, source)
            VALUES
                (:slug, :title, :category, :summary, :thumbnail_url, :body, :tags, :published_at, :source)
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title, category = EXCLUDED.category,
                summary = EXCLUDED.summary, thumbnail_url = EXCLUDED.thumbnail_url,
                body = EXCLUDED.body, tags = EXCLUDED.tags,
                published_at = EXCLUDED.published_at, source = EXCLUDED.source,
                updated_at = now()
            """
        ),
        guide,
    )


def run(dry_run: bool = False) -> None:
    if not CONTENT_DIR.exists():
        print(f"콘텐츠 폴더가 없습니다: {CONTENT_DIR}")
        return

    files = sorted(CONTENT_DIR.glob("*.md"))
    if not files:
        print(f"발행할 .md 파일이 없습니다: {CONTENT_DIR}")
        return

    db = Session()
    try:
        saved = 0
        for path in files:
            raw = path.read_text(encoding="utf-8")
            meta, body_md = parse_front_matter(raw)
            h1_title, body_md = strip_leading_h1(body_md)

            slug = meta.get("slug") or path.stem
            title = meta.get("title") or h1_title
            if not title:
                print(f"- {path.name}: 제목이 없어 건너뜀 (front matter의 title 또는 맨 앞 # 제목 필요)")
                continue

            guide = {
                "slug": slug,
                "title": title,
                "category": meta.get("category") or "가드닝 기초",
                "summary": meta.get("summary") or None,
                "thumbnail_url": meta.get("thumbnail") or None,
                "body": to_html(body_md),
                "tags": meta.get("tags") or [],
                "published_at": parse_published_at(meta.get("published")),
                "source": SOURCE,
            }

            if dry_run:
                print(f"  [dry-run] {slug} — {title} (태그 {guide['tags']})")
                continue

            upsert(db, guide)
            db.commit()
            saved += 1
            print(f"+ {title} ({slug})")

        if not dry_run:
            print(f"완료: {saved}/{len(files)}건 발행")
    finally:
        db.close()


if __name__ == "__main__":
    run(dry_run="--dry-run" in sys.argv)
