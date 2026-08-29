"""쿠팡 파트너스 상품 추천 테이블 — 멱등(재실행 안전).

match_keywords: 가드닝팁 태그/제목이나 식물의 물주기·빛 라벨과 부분일치시켜
추천 상품을 고르는 키. 정확한 태그 체계가 아니라 느슨한 키워드 매칭이라
관리자가 자유롭게 추가/조정할 수 있게 배열로 둔다.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS affiliate_products (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL,
        coupang_url TEXT NOT NULL,
        match_keywords TEXT[] NOT NULL DEFAULT '{}',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    # 검색 링크 방식이라 API 없이는 상품 이미지가 없음 — 관리자가 대표 이미지를
    # 수동으로 넣을 수 있게 nullable 컬럼 추가(없으면 텍스트 카드로만 노출).
    "ALTER TABLE affiliate_products ADD COLUMN IF NOT EXISTS image_url TEXT",
]


def run() -> None:
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            conn.execute(text(stmt))
    print("완료: affiliate_products 테이블 준비됨")


if __name__ == "__main__":
    run()
