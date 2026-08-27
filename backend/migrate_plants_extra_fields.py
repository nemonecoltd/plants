"""plants 테이블에 농사로 원본 API의 추가 필드 반영 — 초기 수집기가 케어 카드에
필요한 6개 필드만 옮기고 나머지는 누락했던 것을 보완(2026-08-27, 모두의농업 비교로 발견).
향후 필터/추천(리텐션) 기능에 쓸 수 있도록 다중값 필드는 배열로 저장."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

ALTER_PLANTS = """
ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS family TEXT,
    ADD COLUMN IF NOT EXISTS origin TEXT,
    ADD COLUMN IF NOT EXISTS growth_form TEXT,
    ADD COLUMN IF NOT EXISTS leaf_color TEXT[],
    ADD COLUMN IF NOT EXISTS flower_color TEXT[],
    ADD COLUMN IF NOT EXISTS fruit_color TEXT[],
    ADD COLUMN IF NOT EXISTS leaf_pattern TEXT,
    ADD COLUMN IF NOT EXISTS leaf_style TEXT,
    ADD COLUMN IF NOT EXISTS propagation_methods TEXT[],
    ADD COLUMN IF NOT EXISTS pests TEXT[],
    ADD COLUMN IF NOT EXISTS toxicity TEXT;
"""


def migrate():
    with engine.begin() as conn:
        conn.execute(text(ALTER_PLANTS))
    print("완료: plants 테이블에 추가 필드 반영됨")


if __name__ == "__main__":
    migrate()
