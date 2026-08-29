"""쿠팡 파트너스 상품 초기 5종 등록. 재실행해도 label 기준 중복 방지."""
from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)

PRODUCTS = [
    {
        "label": "배양토 (분갈이 흙)",
        "coupang_url": "https://link.coupang.com/a/gBrMSNpEXY",
        "match_keywords": [
            "분갈이", "화분관리", "화분 관리", "뿌리썩음", "뿌리 썩", "화분냄새", "화분 냄새",
            "새 식물", "옮겨심기", "배양토", "흙",
        ],
        "sort_order": 1,
    },
    {
        "label": "식물 친환경 살충제",
        "coupang_url": "https://link.coupang.com/a/gBrSYXQJEW",
        "match_keywords": [
            "병충해", "응애", "깍지벌레", "뿌리파리", "흰가루병", "해충", "날파리", "곰팡이",
            "방제", "무름병",
        ],
        "sort_order": 2,
    },
    {
        "label": "배수 좋은 화분",
        "coupang_url": "https://link.coupang.com/a/gBrrgrkIKa",
        "match_keywords": [
            "화분크기", "화분 크기", "배수", "배수구", "화분 배수", "과습",
        ],
        "sort_order": 3,
    },
    {
        "label": "식물 영양제",
        "coupang_url": "https://link.coupang.com/a/gBrVnOg1Uy",
        "match_keywords": [
            "영양", "비료", "성장 멈춤", "잎노랗게", "잎 노랗게", "새순", "새 잎", "생육",
        ],
        "sort_order": 4,
    },
    {
        "label": "식물 생장등 (식물등)",
        "coupang_url": "https://link.coupang.com/a/gBrXI0XbxY",
        "match_keywords": [
            "저광도", "음지", "북향", "햇빛", "빛부족", "빛 부족", "광합성", "일조량",
        ],
        "sort_order": 5,
    },
]


def run() -> None:
    with engine.begin() as conn:
        for p in PRODUCTS:
            exists = conn.execute(
                text("SELECT 1 FROM affiliate_products WHERE label = :label"), {"label": p["label"]}
            ).first()
            if exists:
                print(f"- {p['label']}: 이미 있음, 건너뜀")
                continue
            conn.execute(
                text(
                    """
                    INSERT INTO affiliate_products (label, coupang_url, match_keywords, sort_order)
                    VALUES (:label, :coupang_url, :match_keywords, :sort_order)
                    """
                ),
                p,
            )
            print(f"+ {p['label']}")
    print("완료")


if __name__ == "__main__":
    run()
