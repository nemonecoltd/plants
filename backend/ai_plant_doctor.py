"""사진 한 장으로 식물을 식별하고 상태를 진단 — "AI Plant Companion"의 핵심.

ai_content_service.py와 같은 구조화 출력(response_mime_type="application/json") 패턴을
쓰되, 입력에 이미지가 들어간다는 점만 다르다. 클라이언트는 진단 결과를 그대로 화면에
보여주고 마이가든에 저장하므로, 여기서 돌려주는 JSON이 곧 하나의 콘텐츠가 된다.

태그를 자유롭게 짓게 두면 "과습"/"물 과다"처럼 표기가 갈려 기존 가드닝팁·쿠팡 상품과
매칭이 안 된다. 그래서 서비스에 이미 쌓여 있는 표현을 우선 어휘로 제시한다
(ProductRecommendation.matchProducts가 부분일치로 매칭하므로 표기가 맞아야 한다).
"""
from __future__ import annotations

import json
import os

from google import genai
from google.genai import types

# ai_content_service.py와 같은 이유로 첫 호출 때 만든다(GEMINI_API_KEY가 없어도
# 나머지 API는 정상 동작해야 하므로 — main.py 전체가 이 모듈을 import함).
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


# 기존 가드닝팁 태그·쿠팡 상품 match_keywords와 표기를 맞추기 위한 우선 어휘
_PREFERRED_TAGS = [
    "과습", "물주기", "뿌리썩음", "병충해", "응애", "깍지벌레", "잎 노랗게", "낙엽",
    "분갈이", "화분크기", "배수", "웃자람", "햇빛부족", "차광", "건조", "습도",
    "영양부족", "비료", "곰팡이", "통풍", "겨울나기", "식물살리기",
]

_SYSTEM_PROMPT = f"""당신은 NEMONE PLANTS의 식물 진단 전문가입니다. 사용자가 자기 식물
사진을 올리면, 어떤 식물인지 알아보고 지금 상태가 어떤지 짚어준 뒤 당장 무엇을 해야
하는지 알려줍니다.

말투와 태도:
- 초보 식물집사에게 말하듯 쉽고 다정하게. 다만 근거 없이 안심시키지는 않는다
- 사진만으로 확실하지 않은 건 단정하지 말고 "~로 보여요", "확인해 보세요"로 표현한다
- 겁주지 않는다. 문제가 있어도 지금 할 수 있는 조치를 반드시 함께 준다

판단 규칙:
- 사진에 식물이 없거나 너무 흐려서 알아볼 수 없으면 status를 "unknown"으로 하고
  headline에 다시 찍어달라는 안내를 담는다(추측해서 지어내지 말 것)
- status는 다음 중 하나: "healthy"(건강함) / "caution"(신경 쓸 부분 있음) /
  "danger"(빠른 조치 필요) / "unknown"(식별 불가)
- plant_name은 한국어 일반명(예: 몬스테라). 확실하지 않으면 "○○로 보이는 식물"처럼 쓴다

body_md 작성 규칙:
- 마크다운. `## 소제목`으로 2~4구간(예: "지금 상태", "이렇게 해주세요", "앞으로 관리법")
- 첫 문단은 결론부터. 전체 400~700자 내외로 짧게
- 표는 쓰지 않는다(모바일에서 좁음). 조치는 목록(-)으로 쓴다

tags 규칙:
- 이 서비스의 가드닝팁·용품과 연결되는 열쇠라 표기가 중요하다
- 아래 어휘에 해당하는 게 있으면 반드시 그 표기 그대로 쓴다:
  {", ".join(_PREFERRED_TAGS)}
- 해당하는 게 없을 때만 새 표현을 만든다. 3~5개.

다음 JSON 스키마로만 응답한다(다른 텍스트 없이):
{{
  "plant_name": "몬스테라",
  "scientific_name": "Monstera deliciosa",
  "status": "caution",
  "headline": "한 줄 진단(40자 내외, 사용자가 가장 먼저 읽는 문장)",
  "body_md": "## 지금 상태\\n\\n...",
  "tags": ["과습", "잎 노랗게"],
  "actions": ["당장 해야 할 조치 한 줄", "두 번째 조치"]
}}
scientific_name은 모르면 빈 문자열로 둔다."""


def diagnose_plant(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """사진 → 진단 JSON. 실패 시 예외를 그대로 올려 호출부(main.py)가 502로 변환한다."""
    response = _get_client().models.generate_content(
        # 이미지 판독은 flash로도 품질이 충분하고, 하루 3회 제한이 있어도 사용자당
        # 응답 속도가 체감에 직결돼 pro 대신 flash를 쓴다.
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            _SYSTEM_PROMPT,
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    data = json.loads(response.text)

    required = ["plant_name", "status", "headline", "body_md", "tags"]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Gemini 응답에 필드 누락: {missing}")

    if data["status"] not in ("healthy", "caution", "danger", "unknown"):
        data["status"] = "caution"
    data.setdefault("scientific_name", "")
    data.setdefault("actions", [])
    return data
