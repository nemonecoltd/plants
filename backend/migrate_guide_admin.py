"""관리자 화면(/admin) 지원 컬럼 추가 — 멱등(재실행 안전).

is_hero: "메인 고정" 체크박스 상태. body_md: 관리자 화면으로 작성/수정한 글의
원본 마크다운(수정 화면에서 다시 불러오기 위함). 둘 다 nullable/기본값이 있어
기존 231건(nongsaro)에는 영향 없음.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

STATEMENTS = [
    "ALTER TABLE guides ADD COLUMN IF NOT EXISTS is_hero BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE guides ADD COLUMN IF NOT EXISTS body_md TEXT",
]


def run() -> None:
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            conn.execute(text(stmt))
    print("완료: guides.is_hero / guides.body_md 컬럼 준비됨")


if __name__ == "__main__":
    run()
