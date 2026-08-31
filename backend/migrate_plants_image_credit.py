"""plants 테이블에 image_credit 컬럼 추가 — Wikimedia Commons에서 핫링크로 가져온
사진의 출처(작가/라이선스/원본페이지)를 표시하기 위함(2026-08-31).
파일을 다운로드하지 않고 image_urls에 원본 URL을 그대로 저장하는 방식이라
(레포 용량 부담 방지, ~1,700종 규모라 다운로드시 부담됨), 출처표시 의무 이행을
위해 이 텍스트를 같이 저장해 상세페이지에 노출한다."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

ALTER_PLANTS = """
ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS image_credit TEXT;
"""


def migrate():
    with engine.begin() as conn:
        conn.execute(text(ALTER_PLANTS))
    print("완료: plants 테이블에 image_credit 컬럼 추가됨")


if __name__ == "__main__":
    migrate()
