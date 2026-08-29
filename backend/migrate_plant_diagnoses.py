"""AI 식물 진단 기록 테이블 — 사진을 올려 받은 진단 결과를 마이가든에 남긴다.

user_id는 saved_plants/saved_guides와 동일하게 Supabase auth.users의 UUID를 문자열로만
저장한다(별도 users 테이블/FK 없음). 진단은 하루 3회 제한이라 사용량 집계도 이 테이블의
created_at으로 계산하므로 (user_id, created_at) 인덱스가 조회/제한 양쪽에 모두 쓰인다.
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS plant_diagnoses (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    plant_name TEXT,
    scientific_name TEXT,
    matched_plant_slug TEXT,
    status TEXT,
    headline TEXT,
    body_md TEXT,
    body_html TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

INDEXES = [
    # 마이가든 목록(최신순)과 하루 3회 제한 집계가 모두 이 인덱스를 탄다
    "CREATE INDEX IF NOT EXISTS idx_plant_diagnoses_user ON plant_diagnoses (user_id, created_at DESC)",
]


def migrate():
    with engine.begin() as conn:
        conn.execute(text(CREATE_TABLE))
        for sql in INDEXES:
            conn.execute(text(sql))
    print("완료: plant_diagnoses 테이블 준비됨")


if __name__ == "__main__":
    migrate()
