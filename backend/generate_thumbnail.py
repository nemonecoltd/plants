"""가드닝팁(자체 제작 글)의 상단 이미지를 브랜드 아이콘/컬러로 자동 생성.
외부 API·스톡사진 없이 PIL만 사용 — 대신 한글 렌더링에 macOS 시스템 폰트
(AppleSDGothicNeo)를 쓰므로 이 스크립트는 서버가 아니라 로컬(맥)에서만 실행한다.
import_guides.py가 발행 시점에 이 함수를 호출해 없는 썸네일만 채운다.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FRONTEND_PUBLIC = Path(__file__).resolve().parent.parent / "frontend" / "public"
ICON_PATH = FRONTEND_PUBLIC / "brand" / "logo-icon.png"
LOGO_PATH = FRONTEND_PUBLIC / "brand" / "logo-horizontal.png"
FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

CREAM = (244, 246, 244, 255)
PRIMARY = (45, 90, 39, 255)  # --plant-primary
SECONDARY_BADGE = (138, 154, 134, 40)  # 사이트의 bg-plant-secondary/15 톤과 동일 계열

W, H = 1200, 900


def _font(size: int, index: int = 6) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size, index=index)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
            continue
        if current:
            lines.append(current)
        if draw.textlength(word, font=font) <= max_width:
            current = word
            continue
        # 단어 하나가 폭을 넘으면(긴 영단어 등) 글자 단위로 강제 줄바꿈
        chunk = ""
        for ch in word:
            if draw.textlength(chunk + ch, font=font) > max_width and chunk:
                lines.append(chunk)
                chunk = ch
            else:
                chunk += ch
        current = chunk
    if current:
        lines.append(current)
    return lines


def generate_thumbnail(slug: str, title: str, category: str | None, out_dir: Path | None = None) -> Path:
    out_dir = out_dir or (FRONTEND_PUBLIC / "images" / "guides")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.png"

    img = Image.new("RGBA", (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    # 우하단 브랜드 아이콘을 크게, 아주 옅게 — 워터마크처럼 은은한 질감만 남김
    if ICON_PATH.exists():
        wm_size = 460
        icon = Image.open(ICON_PATH).convert("RGBA").resize((wm_size, wm_size), Image.LANCZOS)
        r, g, b, a = icon.split()
        icon.putalpha(a.point(lambda v: int(v * 0.14)))
        margin = 50
        img.alpha_composite(icon, (W - wm_size - margin, H - wm_size - margin))

    pad = 90
    # 카드(4:3)뿐 아니라 상세페이지 히어로(16:9)로도 쓰이는데, 4:3→16:9는 상하를
    # 각 112.5px씩 잘라내므로 배지/로고가 이 영역 밖으로 나가면 크롭 시 잘려 보인다.
    safe_top, safe_bottom = 120, 120

    # 카테고리 배지
    title_top = safe_top + 10
    if category:
        badge_font = _font(30, index=4)
        tw = draw.textlength(category, font=badge_font)
        bx0, by0 = pad, safe_top
        bx1, by1 = bx0 + tw + 48, by0 + 62
        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=31, fill=SECONDARY_BADGE)
        draw.text((bx0 + 24, by0 + 13), category, font=badge_font, fill=PRIMARY)
        title_top = by1 + 46

    # 제목 — 줄이 너무 많이 나오면 폰트를 줄여서 4줄 이내로 맞춘다
    max_w = W - pad * 2 - 60
    size = 74
    while True:
        title_font = _font(size, index=6)
        lines = _wrap_text(draw, title, title_font, max_w)
        if len(lines) <= 4 or size <= 44:
            break
        size -= 6

    line_height = int(title_font.size * 1.34)
    y = title_top
    for line in lines:
        draw.text((pad, y), line, font=title_font, fill=PRIMARY)
        y += line_height

    # 좌하단 워드마크 — 실제 브랜드 로고 그대로 배치(세이프존 하단에 맞춰 정렬)
    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_w = 250
        logo = logo.resize((logo_w, int(logo.height * logo_w / logo.width)), Image.LANCZOS)
        img.alpha_composite(logo, (pad, H - safe_bottom - logo.height))

    img.convert("RGB").save(out_path, "PNG")
    return out_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("사용법: python3 generate_thumbnail.py <slug> <title> [category]")
        raise SystemExit(1)
    path = generate_thumbnail(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    print(f"생성됨: {path}")
