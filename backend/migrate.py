"""1차 스키마 생성 — matmatch의 migrate_analytics.py와 동일한 방식(멱등성 있는 raw SQL,
Alembic 미사용). 지금 범위는 plants 테이블만. 나머지(guides/regions/my_plants 등)는
인증/마이페이지 작업 시 추가."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

CREATE_PLANTS = """
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_kr TEXT NOT NULL,
    name_en TEXT,
    scientific_name TEXT,
    category TEXT,
    tags TEXT[],
    planting_months INT[],
    bloom_months INT[],
    watering_level TEXT,
    sunlight TEXT,
    soil_type TEXT[],
    hardiness_zone INT,
    min_temp_c INT,
    difficulty TEXT,
    description TEXT,
    image_urls TEXT[],
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
"""


def migrate():
    with engine.begin() as conn:
        conn.execute(text(CREATE_PLANTS))
    print("완료: plants 테이블 준비됨")


if __name__ == "__main__":
    migrate()
