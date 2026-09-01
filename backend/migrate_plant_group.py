"""plants 테이블에 plant_group 컬럼 추가 — 꽃/나무/과일/건조/기타 5분류 표시용(2026-09-01).
실제 값 채우기는 classify_plant_groups.py가 담당."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

ALTER_PLANTS = """
ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS plant_group TEXT;
"""


def migrate():
    with engine.begin() as conn:
        conn.execute(text(ALTER_PLANTS))
    print("완료: plants 테이블에 plant_group 컬럼 추가됨")


if __name__ == "__main__":
    migrate()
