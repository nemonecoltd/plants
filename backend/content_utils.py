"""마크다운→HTML 변환, 슬러그 중복 처리 — import_guides.py와 관리자 API가 공유."""
from __future__ import annotations

import re
from pathlib import Path

import markdown as md
from sqlalchemy import text

# 로컬은 plants/backend, plants/frontend 형제 폴더 구조지만, 프로덕션(VM)은
# ~/apps/plants_backend, ~/apps/plants_frontend로 각각 독립 배포되어 있어 이름이 다르다.
# 프로덕션의 ~/apps/에는 다른 서비스의 "frontend"라는 폴더도 같이 있어(공유 배포 루트),
# "plants_frontend"(더 구체적인 이름)를 먼저 확인해야 엉뚱한 서비스 폴더에 쓰지 않는다.
_APPS_ROOT = Path(__file__).resolve().parent.parent
_FRONTEND_CANDIDATES = ["plants_frontend", "frontend"]
_frontend_dir = next(
    (d for name in _FRONTEND_CANDIDATES if (d := _APPS_ROOT / name).is_dir()),
    _APPS_ROOT / "frontend",
)
GUIDES_IMAGE_DIR = _frontend_dir / "public" / "images" / "guides"


def strip_leading_h1(body: str) -> tuple[str | None, str]:
    """맨 앞 H1을 제목으로 뽑고 본문에서 제거 — 제목이 화면에 두 번 나오는 것 방지.
    본문 중간의 H1은 실제 소제목일 수 있으므로 건드리지 않는다(맛매치 어드민과 동일 규칙)."""
    lines = body.lstrip("\n").splitlines()
    if lines and re.match(r"^#\s+\S", lines[0]):
        title = lines[0].lstrip("#").strip()
        rest = lines[1:]
        while rest and not rest[0].strip():
            rest.pop(0)
        return title, "\n".join(rest)
    return None, body


def to_html(body_md: str) -> str:
    # tables: 비교표(예: 계절별 물주기 차이)를 쓰기 위해 필요
    # nl2br 없이 — 마크다운 표준대로 빈 줄로 문단을 나눈다
    return md.markdown(body_md, extensions=["tables", "sane_lists", "attr_list"])


def dedupe_slug(base_slug: str, db, exclude_slug: str | None = None) -> str:
    """base_slug가 이미 쓰이고 있으면 -2, -3 ...을 붙여 비어있는 슬러그를 찾는다.
    exclude_slug: 수정 중인 글 자신의 현재 슬러그(자기 자신과 충돌 검사에서 제외)."""
    slug = base_slug
    n = 2
    while True:
        row = db.execute(
            text("SELECT 1 FROM guides WHERE slug = :slug AND slug != COALESCE(:exclude, '')"),
            {"slug": slug, "exclude": exclude_slug},
        ).first()
        if not row:
            return slug
        slug = f"{base_slug}-{n}"
        n += 1
