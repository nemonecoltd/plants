"""이미지가 없는 plants 항목에 Wikimedia Commons 사진을 학명으로 검색해서 채운다.

fetch_wikimedia_photos.py(2026-08 초, 시드 20종 화면 껍데기용)와 달리 이건
파일을 다운로드하지 않고 image_urls에 Wikimedia 원본 URL을 그대로 저장(핫링크)한다.
국립수목원 API로 늘어난 자생식물 1,500여 종에 사진이 하나도 없어서(그 API엔
이미지 필드 자체가 없음) 다운로드 방식은 레포·서버 용량 부담이 크다고 판단해
이 방식으로 결정(2026-08-31). Commons에 올라간 파일은 정책상 전부 자유이용
라이선스(퍼블릭도메인/CC-BY/CC-BY-SA 등)라 상업적 이용에 문제없고, 대신
image_credit에 작가·라이선스·원본페이지를 저장해 상세페이지에 노출(출처표시 의무).

data.go.kr류 일일 호출한도는 없지만 Wikimedia에 예의상 요청 간 딜레이를 둔다.

사용법:
  python fetch_plant_images_wikimedia.py [예산]   # 생략 시 기본 500
"""
import sys
import time

from sqlalchemy import text

from collect_forest_plant_resource import Session
from fetch_wikimedia_photos import search_image


def run(budget: int) -> None:
    db = Session()
    try:
        rows = db.execute(text(
            "SELECT id, scientific_name, name_kr FROM plants "
            "WHERE (image_urls IS NULL OR array_length(image_urls, 1) IS NULL) "
            "AND scientific_name IS NOT NULL"
        )).mappings().all()
        print(f"이미지 필요한 항목: {len(rows)}건 (이번 실행 예산 {budget}건)")

        used = 0
        found = 0
        for row in rows:
            if used >= budget:
                print(f"예산({budget}) 소진 — 다시 실행하면 이어서 처리됩니다.")
                break
            used += 1

            try:
                result = search_image(f"{row['scientific_name']} plant")
            except Exception as e:
                print(f"  [{row['name_kr']}] 검색 오류: {e}")
                result = None
            time.sleep(0.4)

            if not result:
                continue

            credit = f"사진: {result['artist']} · {result['license']} (Wikimedia Commons)"
            db.execute(
                text("UPDATE plants SET image_urls = :urls, image_credit = :credit, updated_at = now() WHERE id = :id"),
                {"urls": [result["url"]], "credit": credit, "id": row["id"]},
            )
            found += 1

            if used % 50 == 0:
                db.commit()
                print(f"  ...{used}건 검색, {found}건 매칭", flush=True)

        db.commit()
        print(f"\n완료: {used}건 검색, {found}종 이미지 반영")
    finally:
        db.close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 500)
