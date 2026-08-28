"""마이가든(저장한 식물/가드닝팁) 테이블 생성 — 다른 네모네 서비스와 동일한 패턴으로
user_id에 Supabase auth.users의 UUID를 문자열로만 저장한다(별도 users 테이블/FK 없음).
matmatch의 Like.user_id, now_back의 likes/saved_courses가 같은 방식."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

CREATE_SAVED_PLANTS = """
CREATE TABLE IF NOT EXISTS saved_plants (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    plant_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, plant_slug)
);
"""

CREATE_SAVED_GUIDES = """
CREATE TABLE IF NOT EXISTS saved_guides (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    guide_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, guide_slug)
);
"""

# 마이가든은 항상 "내 저장 목록"만 조회하므로 user_id 인덱스가 사실상 모든 쿼리에 쓰임
INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_saved_plants_user ON saved_plants (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_saved_guides_user ON saved_guides (user_id)",
]


def migrate():
    with engine.begin() as conn:
        conn.execute(text(CREATE_SAVED_PLANTS))
        conn.execute(text(CREATE_SAVED_GUIDES))
        for sql in INDEXES:
            conn.execute(text(sql))
    print("완료: saved_plants / saved_guides 테이블 준비됨")


if __name__ == "__main__":
    migrate()
