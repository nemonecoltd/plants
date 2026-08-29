"""진단 결과를 공개 피드에 노출하기 위한 컬럼 추가.

기본값을 true로 두는 이유: 진단은 "내 식물 사진 + AI 소견"이라 개인 식별 정보가 아니고,
피드에도 작성자를 표시하지 않는다(익명). 다만 집 내부가 찍힐 수 있으니 사용자가
마이가든에서 언제든 개별로 내릴 수 있게 이 컬럼을 토글로 쓴다.

created_at DESC 정렬 + is_public 필터가 피드의 유일한 쿼리라 부분 인덱스로 충분하다.
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

STATEMENTS = [
    "ALTER TABLE plant_diagnoses ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true",
    "CREATE INDEX IF NOT EXISTS idx_plant_diagnoses_feed "
    "ON plant_diagnoses (created_at DESC) WHERE is_public",
]


def migrate():
    with engine.begin() as conn:
        for sql in STATEMENTS:
            conn.execute(text(sql))
    print("완료: plant_diagnoses.is_public 준비됨")


if __name__ == "__main__":
    migrate()
