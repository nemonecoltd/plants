"""메인페이지 껍데기(mockup)에 쓸 실사 이미지를 Wikimedia Commons API로 검색·다운로드.
가짜 URL을 추측하지 않고 API로 실제 존재하는 파일을 찾아 받는다 — CC 라이선스라
무료·즉시 사용 가능. 이미지는 frontend/public/images/plants/{slug}.jpg 로 저장하고,
출처/라이선스는 credits.json에 기록(추후 정식 반영 시 크레딧 표기용).

주의: 이 이미지들은 우리 DB(plants 테이블)와 연결하지 않음 — 지금은 화면 껍데기용
정적 파일이고, 실제 데이터 파이프라인(농사로 API 등)이 붙으면 그때 정식 이미지로 교체.
"""
from __future__ import annotations

import json
import os
import re
import time

import requests

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "plants")
CREDITS_PATH = os.path.join(OUT_DIR, "credits.json")
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "NemonePlantsBot/0.1 (contact@nemoneai.com)"}

# (slug, 검색어) — 우리 20종 시드 데이터와 매칭되는 학명/영문명
QUERIES = [
    ("monstera-deliciosa", "Monstera deliciosa plant"),
    ("sansevieria-trifasciata", "Dracaena trifasciata snake plant"),
    ("pachira-aquatica", "Pachira aquatica money tree"),
    ("zamioculcas-zamiifolia", "Zamioculcas zamiifolia ZZ plant"),
    ("spathiphyllum", "Spathiphyllum peace lily"),
    ("ficus-elastica", "Ficus elastica rubber plant pot indoor leaf"),
    ("echeveria", "Echeveria succulent"),
    ("opuntia", "Opuntia cactus"),
    ("anthurium-andraeanum", "Anthurium andraeanum flower"),
    ("nephrolepis-exaltata", "Nephrolepis exaltata Boston fern"),
    ("rosa-hybrid", "Rosa garden rose"),
    ("tulipa-gesneriana", "Tulipa garden tulip"),
    ("chrysanthemum", "Chrysanthemum flower"),
    ("prunus-serrulata", "Prunus serrulata cherry blossom"),
    ("lavandula-angustifolia", "Lavandula angustifolia lavender field"),
    ("mentha", "Mentha mint plant"),
    ("ocimum-basilicum", "Ocimum basilicum basil plant"),
    ("ulmus-parvifolia-yulma", "Cupressus macrocarpa Goldcrest tree"),
    ("pinus-densiflora", "Pinus densiflora Korean red pine"),
    ("lycopersicon-esculentum", "cherry tomato plant vine"),
]

HERO_QUERY = "indoor plants shelf sunlight interior"


def search_image(query: str) -> dict | None:
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": 6,
        "gsrlimit": 6,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 900,
        "format": "json",
    }
    resp = requests.get(API, params=params, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    pages = (resp.json().get("query") or {}).get("pages") or {}
    candidates = list(pages.values())
    for c in candidates:
        info = (c.get("imageinfo") or [None])[0]
        if not info:
            continue
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if info.get("width", 0) < 500 or info.get("height", 0) < 400:
            continue
        meta = info.get("extmetadata", {})
        return {
            "title": c.get("title"),
            "url": info.get("thumburl") or info.get("url"),
            "artist": re.sub("<[^>]+>", "", (meta.get("Artist", {}).get("value") or "정보 없음")),
            "license": meta.get("LicenseShortName", {}).get("value") or "정보 없음",
            "source_page": f"https://commons.wikimedia.org/wiki/{c.get('title', '').replace(' ', '_')}",
        }
    return None


def download(url: str, dest: str) -> None:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        f.write(resp.content)


def run():
    os.makedirs(OUT_DIR, exist_ok=True)
    credits = {}

    hero = search_image(HERO_QUERY)
    if hero:
        download(hero["url"], os.path.join(OUT_DIR, "hero.jpg"))
        credits["hero"] = hero
        print(f"+ hero: {hero['title']}")
    else:
        print("- hero: 매칭 실패")
    time.sleep(0.3)

    for slug, query in QUERIES:
        try:
            result = search_image(query)
            if not result:
                print(f"- {slug}: 매칭 실패")
                continue
            download(result["url"], os.path.join(OUT_DIR, f"{slug}.jpg"))
            credits[slug] = result
            print(f"+ {slug}: {result['title']}")
        except Exception as e:
            print(f"- {slug}: 오류 {e}")
        time.sleep(0.3)

    with open(CREDITS_PATH, "w", encoding="utf-8") as f:
        json.dump(credits, f, ensure_ascii=False, indent=2)
    print(f"완료: {len(credits)}개 이미지 저장, 출처는 {CREDITS_PATH}")


if __name__ == "__main__":
    run()
