"""guides 테이블 생성 — matmatch/migrate.py와 동일한 멱등 SQL 방식(Alembic 미사용).
농사로 flwrDecor(꽃장식과 정원 꾸미기) API 수집 대상."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

CREATE_GUIDES = """
CREATE TABLE IF NOT EXISTS guides (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    summary TEXT,
    materials TEXT,
    thumbnail_url TEXT,
    image_urls TEXT[],
    body TEXT,
    published_at TIMESTAMPTZ,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
"""


def migrate():
    with engine.begin() as conn:
        conn.execute(text(CREATE_GUIDES))
    print("완료: guides 테이블 준비됨")


if __name__ == "__main__":
    migrate()
