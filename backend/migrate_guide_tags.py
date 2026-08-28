"""guides 테이블에 tags 컬럼 추가 — 롱테일 키워드로 글을 묶고 태그 페이지를 만들기 위함.

기존 231건(농사로 수집분)은 태그가 비어 있고, 자체 제작 글(source='original')에만 채운다.
태그로 조회하는 쿼리(WHERE tags @> ARRAY['물주기'])가 주 사용 패턴이라 GIN 인덱스를 건다."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

STATEMENTS = [
    "ALTER TABLE guides ADD COLUMN IF NOT EXISTS tags TEXT[]",
    "CREATE INDEX IF NOT EXISTS idx_guides_tags ON guides USING GIN (tags)",
]


def migrate():
    with engine.begin() as conn:
        for sql in STATEMENTS:
            conn.execute(text(sql))
    print("완료: guides.tags 컬럼 및 GIN 인덱스 준비됨")


if __name__ == "__main__":
    migrate()
