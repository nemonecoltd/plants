"""관리자 화면의 "AI로 초안 생성" — 키워드만 받아 Gemini가 가드닝팁 초안을 작성.

now_back/gemini_service.py의 구조화 출력 패턴(response_mime_type="application/json")을
그대로 따름 — 정규식으로 JSON을 잘라내는 것보다 안정적. 여기서는 DB에 아무것도 쓰지
않고 JSON만 돌려준다(발행 여부는 관리자가 검토 후 별도 버튼으로 결정).
"""
from __future__ import annotations

import json
import os

from google import genai
from google.genai import types

# 호출마다 새로 만들면 내부 httpx 클라이언트가 바로 정리돼 "client has been closed"
# 오류가 남 — now_back/gemini_service.py와 동일하게 전역에 하나만 두되, import 시점이
# 아니라 첫 호출 때 만든다(GEMINI_API_KEY가 없어도 이 기능만 못 쓰고 나머지 API는
# 정상 동작해야 하므로 — main.py 전체가 이 모듈을 import함).
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client

_SYSTEM_PROMPT = """당신은 NEMONE PLANTS(식물도감·가드닝팁 서비스)의 콘텐츠 작가입니다.
목적은 두 가지입니다: ① 식물명이 아니라 실제 검색어(롱테일 키워드)로 유입되는 글을
쓰는 것, ② 광고를 자연스럽게 넣을 수 있도록 본문 중간에 소제목(##)이 있는 구조로
쓰는 것입니다.

스타일 규칙:
- 제목은 사람들이 실제로 검색할 법한 구체적인 문구로 짓는다
  (예: "화분 물주기 시간대, 아침이 좋을까 저녁이 좋을까", "장마철 화분 관리, 물을 안 줘도 죽는 이유")
- 본문은 마크다운. `## 소제목`으로 3~5개 구간을 나누고, 필요하면 표(`| 열 | 열 |`)를 활용한다
- 도입부(첫 소제목 전)는 결론이나 핵심을 먼저 말해준다
- 실용적이고 구체적으로 쓴다. 과장하거나 광고성 문구를 쓰지 않는다
- 분량은 800~1300자 내외
- slug는 영문 소문자 kebab-case로 짧게(예: pot-watering-time-evening) — 한글 제목의 핵심을 영어로 요약

다음 JSON 스키마로만 응답한다(다른 텍스트 없이):
{
  "title": "제목",
  "slug": "kebab-case-slug",
  "summary": "한 줄 요약(50자 내외)",
  "category": "가드닝 기초",
  "tags": ["태그1", "태그2"],
  "body_markdown": "# 제목\\n\\n본문..."
}
body_markdown은 반드시 "# 제목"으로 시작해야 한다."""


def generate_guide_draft(keywords: str) -> dict:
    prompt = f"{_SYSTEM_PROMPT}\n\n---\n관리자가 입력한 키워드/요청사항:\n{keywords}"
    response = _get_client().models.generate_content(
        model="gemini-2.5-pro",
        contents=prompt,
        # gemini-2.5-pro는 flash와 달리 thinking_budget=0을 거부한다("This model only
        # works in thinking mode") — 허용 최솟값(128)으로 낮춰 비용만 줄인다.
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(thinking_budget=128),
        ),
    )
    data = json.loads(response.text)

    required = ["title", "slug", "summary", "category", "tags", "body_markdown"]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Gemini 응답에 필드 누락: {missing}")
    return data
