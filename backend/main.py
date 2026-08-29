"""NEMONE PLANTS 백엔드 — matmatch/now_back과 동일하게 FastAPI + 동기 SQLAlchemy(psycopg2) 사용.
1차 착수 범위: 메인페이지(목록) + 상세페이지만 동작하면 되므로 plants 테이블 하나만 다룬다."""
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import ARRAY, Boolean, Column, DateTime, Integer, String, Text, create_engine, func, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from ai_content_service import generate_guide_draft
from ai_plant_doctor import diagnose_plant
from content_utils import DIAGNOSES_IMAGE_DIR, GUIDES_IMAGE_DIR, dedupe_slug, strip_leading_h1, to_html
from generate_thumbnail import generate_thumbnail

load_dotenv(".env.local")

# 개화/심는 시기 알림은 "지금 몇 월인가"가 기준이라 서버 UTC가 아닌 한국시간으로 판단
_KST = timezone(timedelta(hours=9))

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Guide(Base):
    __tablename__ = "guides"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String)
    summary = Column(Text)
    materials = Column(Text)
    thumbnail_url = Column(String)
    image_urls = Column(ARRAY(String))
    body = Column(Text)
    tags = Column(ARRAY(String))   # 자체 제작 글(source='original')의 롱테일 키워드
    published_at = Column(DateTime(timezone=True))
    source = Column(String)
    is_hero = Column(Boolean, nullable=False, server_default=text("false"))  # 관리자 "메인 고정"
    body_md = Column(Text)  # 관리자 화면으로 작성/수정한 글의 원본 마크다운(수정 화면용)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    name_kr = Column(String, nullable=False)
    name_en = Column(String)
    scientific_name = Column(String)
    category = Column(String)
    tags = Column(ARRAY(String))
    planting_months = Column(ARRAY(Integer))
    bloom_months = Column(ARRAY(Integer))
    watering_level = Column(String)       # dry / moderate / wet
    sunlight = Column(String)             # full_sun / part_shade / full_shade
    soil_type = Column(ARRAY(String))
    hardiness_zone = Column(Integer)
    min_temp_c = Column(Integer)
    difficulty = Column(String)           # easy / medium / hard
    description = Column(Text)
    image_urls = Column(ARRAY(String))
    family = Column(String)               # 과명(예: 진달래과)
    origin = Column(String)               # 원산지
    growth_form = Column(String)          # 생육형태(직립형/관목형/덩굴성 등)
    leaf_color = Column(ARRAY(String))
    flower_color = Column(ARRAY(String))
    fruit_color = Column(ARRAY(String))
    leaf_pattern = Column(String)
    leaf_style = Column(String)           # 질감/광택/상록여부 등 서술형
    propagation_methods = Column(ARRAY(String))
    pests = Column(ARRAY(String))
    toxicity = Column(Text)
    source = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class AffiliateProduct(Base):
    __tablename__ = "affiliate_products"

    id = Column(Integer, primary_key=True)
    label = Column(String, nullable=False)
    coupang_url = Column(String, nullable=False)
    image_url = Column(String)
    match_keywords = Column(ARRAY(String), nullable=False, server_default=text("'{}'"))
    sort_order = Column(Integer, nullable=False, server_default=text("0"))
    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


app = FastAPI(title="NEMONE PLANTS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://plants.nemoneai.com"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _summary(p: Plant) -> dict:
    return {
        "slug": p.slug,
        "name_kr": p.name_kr,
        "name_en": p.name_en,
        "category": p.category,
        "tags": p.tags,
        "difficulty": p.difficulty,
        "sunlight": p.sunlight,
        "watering_level": p.watering_level,
        "image_urls": p.image_urls,
        "bloom_months": p.bloom_months,
        "min_temp_c": p.min_temp_c,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _detail(p: Plant) -> dict:
    return {
        **_summary(p),
        "scientific_name": p.scientific_name,
        "planting_months": p.planting_months,
        "bloom_months": p.bloom_months,
        "soil_type": p.soil_type,
        "hardiness_zone": p.hardiness_zone,
        "min_temp_c": p.min_temp_c,
        "description": p.description,
        "family": p.family,
        "origin": p.origin,
        "growth_form": p.growth_form,
        "leaf_color": p.leaf_color,
        "flower_color": p.flower_color,
        "fruit_color": p.fruit_color,
        "leaf_pattern": p.leaf_pattern,
        "leaf_style": p.leaf_style,
        "propagation_methods": p.propagation_methods,
        "pests": p.pests,
        "toxicity": p.toxicity,
        "source": p.source,
    }


@app.get("/api/plants")
def list_plants():
    db = SessionLocal()
    try:
        plants = db.query(Plant).order_by(Plant.name_kr).all()
        return {"items": [_summary(p) for p in plants]}
    finally:
        db.close()


@app.get("/api/plants/{slug}")
def get_plant(slug: str):
    db = SessionLocal()
    try:
        plant = db.query(Plant).filter(Plant.slug == slug).first()
        if not plant:
            raise HTTPException(status_code=404, detail="식물을 찾을 수 없습니다")
        return _detail(plant)
    finally:
        db.close()


def _guide_summary(g: Guide) -> dict:
    return {
        "slug": g.slug,
        "title": g.title,
        "category": g.category,
        "summary": g.summary,
        "thumbnail_url": g.thumbnail_url,
        "tags": g.tags or [],
        "source": g.source,
        "is_hero": bool(g.is_hero),
        "published_at": g.published_at.isoformat() if g.published_at else None,
        "updated_at": g.updated_at.isoformat() if g.updated_at else None,
    }


def _guide_detail(g: Guide) -> dict:
    return {
        **_guide_summary(g),
        "materials": g.materials,
        "image_urls": g.image_urls,
        "body": g.body,
        "source": g.source,
    }


@app.get("/api/guides")
def list_guides():
    db = SessionLocal()
    try:
        guides = db.query(Guide).order_by(Guide.published_at.desc().nullslast()).all()
        return {"items": [_guide_summary(g) for g in guides]}
    finally:
        db.close()


@app.get("/api/guide-tags")
def list_guide_tags():
    """태그별 글 수 — 태그 페이지 생성과 sitemap에 쓰인다.
    라우트 순서상 /api/guides/{slug}보다 위에 있어야 slug로 잡히지 않음(경로가 달라 무관하지만 명시)."""
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                """
                SELECT tag, COUNT(*) AS cnt
                FROM guides, unnest(tags) AS tag
                GROUP BY tag
                ORDER BY cnt DESC, tag
                """
            )
        ).all()
        return {"items": [{"tag": r[0], "count": r[1]} for r in rows]}
    finally:
        db.close()


@app.get("/api/guides/{slug}")
def get_guide(slug: str):
    db = SessionLocal()
    try:
        guide = db.query(Guide).filter(Guide.slug == slug).first()
        if not guide:
            raise HTTPException(status_code=404, detail="가드닝팁을 찾을 수 없습니다")
        return _guide_detail(guide)
    finally:
        db.close()


# ── 관리자(/admin) ───────────────────────────────────────────────────────────
# 브라우저는 이 시크릿을 절대 보지 않음 — Next.js 서버(라우트 핸들러/서버 컴포넌트)만
# 알고 있고, matmatch/admin의 x-admin-secret 패턴을 그대로 따른다.
PLANTS_ADMIN_SECRET = os.environ.get("PLANTS_ADMIN_SECRET")


def verify_admin(x_plants_admin_secret: str = Header(None)) -> None:
    if not PLANTS_ADMIN_SECRET or x_plants_admin_secret != PLANTS_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="관리자 인증 실패")


class GuideDraftRequest(BaseModel):
    keywords: str


class GuidePublishRequest(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    body_markdown: str
    is_hero: bool = False


@app.get("/api/admin/guides", dependencies=[Depends(verify_admin)])
def admin_list_guides():
    db = SessionLocal()
    try:
        guides = (
            db.query(Guide)
            .filter(Guide.source == "original")
            .order_by(Guide.created_at.desc())
            .all()
        )
        return {"items": [_guide_summary(g) for g in guides]}
    finally:
        db.close()


@app.get("/api/admin/guides/{slug}", dependencies=[Depends(verify_admin)])
def admin_get_guide(slug: str):
    db = SessionLocal()
    try:
        guide = db.query(Guide).filter(Guide.slug == slug, Guide.source == "original").first()
        if not guide:
            raise HTTPException(status_code=404, detail="가드닝팁을 찾을 수 없습니다")
        return {**_guide_summary(guide), "body_md": guide.body_md}
    finally:
        db.close()


@app.post("/api/admin/guides/draft", dependencies=[Depends(verify_admin)])
def admin_generate_draft(req: GuideDraftRequest):
    if not req.keywords.strip():
        raise HTTPException(status_code=400, detail="키워드를 입력해주세요")
    try:
        return generate_guide_draft(req.keywords)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 초안 생성 실패: {e}")


@app.post("/api/admin/guides", dependencies=[Depends(verify_admin)])
def admin_publish_guide(req: GuidePublishRequest):
    db = SessionLocal()
    try:
        slug = dedupe_slug(req.slug, db)
        _, body_md = strip_leading_h1(req.body_markdown)
        html = to_html(body_md)
        thumbnail_url = None
        out_path = generate_thumbnail(slug, req.title, req.category)
        if out_path.exists():
            # 여기서 만든 파일은 배포 산출물에 없어 Next가 서빙하지 못한다(get_guide_image 참고)
            thumbnail_url = f"/api/guides/image/{slug}.png"

        guide = Guide(
            slug=slug,
            title=req.title,
            category=req.category or "가드닝 기초",
            summary=req.summary,
            thumbnail_url=thumbnail_url,
            body=html,
            body_md=req.body_markdown,
            tags=req.tags,
            published_at=datetime.now(_KST),
            source="original",
            is_hero=req.is_hero,
        )
        db.add(guide)
        db.commit()
        return {"slug": slug}
    finally:
        db.close()


@app.put("/api/admin/guides/{slug}", dependencies=[Depends(verify_admin)])
def admin_update_guide(slug: str, req: GuidePublishRequest):
    db = SessionLocal()
    try:
        guide = db.query(Guide).filter(Guide.slug == slug, Guide.source == "original").first()
        if not guide:
            raise HTTPException(status_code=404, detail="가드닝팁을 찾을 수 없습니다")

        new_slug = dedupe_slug(req.slug, db, exclude_slug=slug) if req.slug != slug else slug
        guide.slug = new_slug
        guide.title = req.title
        guide.category = req.category or "가드닝 기초"
        guide.summary = req.summary
        guide.tags = req.tags
        guide.is_hero = req.is_hero
        guide.body_md = req.body_markdown
        _, stripped_body = strip_leading_h1(req.body_markdown)
        guide.body = to_html(stripped_body)
        guide.updated_at = datetime.now(_KST)
        db.commit()
        return {"slug": new_slug}
    finally:
        db.close()


@app.delete("/api/admin/guides/{slug}", dependencies=[Depends(verify_admin)])
def admin_delete_guide(slug: str):
    db = SessionLocal()
    try:
        guide = db.query(Guide).filter(Guide.slug == slug, Guide.source == "original").first()
        if not guide:
            raise HTTPException(status_code=404, detail="가드닝팁을 찾을 수 없습니다")
        db.delete(guide)
        db.commit()
        # 썸네일 경로가 두 가지(배포 포함분 /images/guides/, 런타임 생성분 /api/guides/image/)라
        # 둘 다 같은 폴더를 가리키므로 어느 쪽이든 파일명으로 지운다
        if guide.thumbnail_url and (
            guide.thumbnail_url.startswith("/images/guides/")
            or guide.thumbnail_url.startswith("/api/guides/image/")
        ):
            thumb_path = GUIDES_IMAGE_DIR / Path(guide.thumbnail_url).name
            thumb_path.unlink(missing_ok=True)
        return {"ok": True}
    finally:
        db.close()


# ── 쿠팡 파트너스 상품 추천 ──────────────────────────────────────────────────
# 태그/제목과 느슨하게 부분일치시켜 보여주는 용도라 매칭 로직은 프론트에 둔다
# (백엔드는 활성 상품 전체 + 매칭 키워드만 내려줌).

def _affiliate_product_summary(p: AffiliateProduct) -> dict:
    return {
        "id": p.id,
        "label": p.label,
        "coupang_url": p.coupang_url,
        "image_url": p.image_url,
        "match_keywords": p.match_keywords or [],
    }


@app.get("/api/affiliate-products")
def list_affiliate_products():
    db = SessionLocal()
    try:
        products = (
            db.query(AffiliateProduct)
            .filter(AffiliateProduct.is_active.is_(True))
            .order_by(AffiliateProduct.sort_order)
            .all()
        )
        return {"items": [_affiliate_product_summary(p) for p in products]}
    finally:
        db.close()


class AffiliateProductRequest(BaseModel):
    label: str
    coupang_url: str
    image_url: Optional[str] = None
    match_keywords: List[str] = []
    sort_order: int = 0
    is_active: bool = True


@app.get("/api/admin/affiliate-products", dependencies=[Depends(verify_admin)])
def admin_list_affiliate_products():
    db = SessionLocal()
    try:
        products = db.query(AffiliateProduct).order_by(AffiliateProduct.sort_order).all()
        return {
            "items": [
                {**_affiliate_product_summary(p), "is_active": p.is_active}
                for p in products
            ]
        }
    finally:
        db.close()


@app.post("/api/admin/affiliate-products", dependencies=[Depends(verify_admin)])
def admin_create_affiliate_product(req: AffiliateProductRequest):
    db = SessionLocal()
    try:
        p = AffiliateProduct(**req.dict())
        db.add(p)
        db.commit()
        return {"id": p.id}
    finally:
        db.close()


@app.put("/api/admin/affiliate-products/{product_id}", dependencies=[Depends(verify_admin)])
def admin_update_affiliate_product(product_id: int, req: AffiliateProductRequest):
    db = SessionLocal()
    try:
        p = db.query(AffiliateProduct).filter(AffiliateProduct.id == product_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다")
        for k, v in req.dict().items():
            setattr(p, k, v)
        p.updated_at = datetime.now(_KST)
        db.commit()
        return {"id": p.id}
    finally:
        db.close()


@app.delete("/api/admin/affiliate-products/{product_id}", dependencies=[Depends(verify_admin)])
def admin_delete_affiliate_product(product_id: int):
    db = SessionLocal()
    try:
        p = db.query(AffiliateProduct).filter(AffiliateProduct.id == product_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다")
        db.delete(p)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


# ── 마이가든 ──────────────────────────────────────────────────────────────────
# user_id는 Supabase auth.users의 UUID를 클라이언트가 그대로 넘긴다(matmatch/now와 동일 패턴).
# 저장 목록은 민감정보가 아니고 기존 서비스들도 같은 방식이라 일관성을 위해 맞췄다.

class SaveRequest(BaseModel):
    user_id: str
    slug: str


def _toggle_save(table: str, slug_column: str, user_id: str, slug: str) -> bool:
    """이미 저장돼 있으면 해제, 아니면 저장. 반환값은 '지금 저장된 상태인가'."""
    db = SessionLocal()
    try:
        existing = db.execute(
            text(f"SELECT id FROM {table} WHERE user_id = :uid AND {slug_column} = :slug"),
            {"uid": user_id, "slug": slug},
        ).first()
        if existing:
            db.execute(
                text(f"DELETE FROM {table} WHERE user_id = :uid AND {slug_column} = :slug"),
                {"uid": user_id, "slug": slug},
            )
            db.commit()
            return False
        db.execute(
            text(f"INSERT INTO {table} (user_id, {slug_column}) VALUES (:uid, :slug) ON CONFLICT DO NOTHING"),
            {"uid": user_id, "slug": slug},
        )
        db.commit()
        return True
    finally:
        db.close()


@app.post("/api/me/saved-plants/toggle")
def toggle_saved_plant(req: SaveRequest):
    return {"saved": _toggle_save("saved_plants", "plant_slug", req.user_id, req.slug)}


@app.post("/api/me/saved-guides/toggle")
def toggle_saved_guide(req: SaveRequest):
    return {"saved": _toggle_save("saved_guides", "guide_slug", req.user_id, req.slug)}


@app.get("/api/me/saved-slugs")
def list_saved_slugs(user_id: str):
    """카드/상세페이지의 하트 상태를 한 번에 칠하기 위한 가벼운 응답(슬러그 목록만)."""
    db = SessionLocal()
    try:
        plants = db.execute(
            text("SELECT plant_slug FROM saved_plants WHERE user_id = :uid"), {"uid": user_id}
        ).scalars().all()
        guides = db.execute(
            text("SELECT guide_slug FROM saved_guides WHERE user_id = :uid"), {"uid": user_id}
        ).scalars().all()
        return {"plants": list(plants), "guides": list(guides)}
    finally:
        db.close()


@app.get("/api/me/garden")
def get_my_garden(user_id: str):
    """마이가든 화면 한 번에 채우기 — 저장한 식물/가드닝팁 + 이번 달 알림.

    알림은 별도 테이블 없이 저장한 식물의 bloom_months/planting_months와 현재 월을
    대조해 매 요청마다 계산한다(정적 데이터라 미리 쌓아둘 이유가 없음)."""
    db = SessionLocal()
    try:
        plant_slugs = db.execute(
            text("SELECT plant_slug FROM saved_plants WHERE user_id = :uid ORDER BY created_at DESC"),
            {"uid": user_id},
        ).scalars().all()
        guide_slugs = db.execute(
            text("SELECT guide_slug FROM saved_guides WHERE user_id = :uid ORDER BY created_at DESC"),
            {"uid": user_id},
        ).scalars().all()

        plants = db.query(Plant).filter(Plant.slug.in_(plant_slugs)).all() if plant_slugs else []
        guides = db.query(Guide).filter(Guide.slug.in_(guide_slugs)).all() if guide_slugs else []

        # 저장한 순서(최신순)를 유지 — IN 절 결과는 순서를 보장하지 않음
        plant_order = {slug: i for i, slug in enumerate(plant_slugs)}
        guide_order = {slug: i for i, slug in enumerate(guide_slugs)}
        plants.sort(key=lambda p: plant_order.get(p.slug, 999))
        guides.sort(key=lambda g: guide_order.get(g.slug, 999))

        month = datetime.now(_KST).month
        blooming = [{"slug": p.slug, "name_kr": p.name_kr} for p in plants if p.bloom_months and month in p.bloom_months]
        planting = [{"slug": p.slug, "name_kr": p.name_kr} for p in plants if p.planting_months and month in p.planting_months]

        notices = []
        if blooming:
            notices.append({
                "type": "bloom",
                "month": month,
                "items": blooming,
                "message": f"{month}월, 저장한 식물 중 {len(blooming)}종이 꽃 피는 시기예요",
            })
        if planting:
            notices.append({
                "type": "planting",
                "month": month,
                "items": planting,
                "message": f"{month}월, 지금 심기 좋은 식물이 {len(planting)}종 있어요",
            })

        return {
            "plants": [_summary(p) for p in plants],
            "guides": [_guide_summary(g) for g in guides],
            "notices": notices,
        }
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────
# AI 식물 진단 — 사진을 올리면 Gemini가 식별·진단하고 그 결과를 마이가든에 남긴다.
# ──────────────────────────────────────────────────────────────────────────────

# 진단 1회가 곧 Gemini 호출 1회(유료)라 계정당 하루 한도를 둔다. 자정 기준은 서버 UTC가
# 아니라 한국시간 — 사용자가 체감하는 "오늘"과 어긋나면 안 되기 때문.
DAILY_DIAGNOSIS_LIMIT = 3

# 사진은 진단의 입력일 뿐 서비스의 전시물이 아니라서, 원본 화질을 지킬 이유가 없다.
# 긴 변 기준으로 줄이고 JPEG로 다시 인코딩해 장당 수십 KB로 떨어뜨린다.
_DIAGNOSIS_IMAGE_MAX_PX = 900
_DIAGNOSIS_IMAGE_QUALITY = 78
_MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 클라이언트가 미리 압축해 보내지만 방어적으로 상한


def _today_start_kst() -> datetime:
    now = datetime.now(_KST)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _count_today_diagnoses(db: Session, user_id: str) -> int:
    return db.execute(
        text("SELECT count(*) FROM plant_diagnoses WHERE user_id = :uid AND created_at >= :since"),
        {"uid": user_id, "since": _today_start_kst()},
    ).scalar_one()


def _compress_image(raw: bytes) -> bytes:
    """어떤 포맷으로 올라오든(HEIC 제외) 축소된 JPEG 하나로 정규화."""
    from io import BytesIO

    from PIL import Image, ImageOps

    img = Image.open(BytesIO(raw))
    # 아이폰 사진은 회전 정보가 EXIF에만 있어서, 이걸 반영하지 않으면 진단용으로
    # 넘길 때도 화면에 보일 때도 눕는다.
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img.thumbnail((_DIAGNOSIS_IMAGE_MAX_PX, _DIAGNOSIS_IMAGE_MAX_PX), Image.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", quality=_DIAGNOSIS_IMAGE_QUALITY, optimize=True)
    return buf.getvalue()


def _diagnosis_row(row) -> dict:
    return {
        "id": row.id,
        "image_url": row.image_url,
        "plant_name": row.plant_name,
        "scientific_name": row.scientific_name,
        "matched_plant_slug": row.matched_plant_slug,
        "status": row.status,
        "headline": row.headline,
        "body_html": row.body_html,
        "tags": list(row.tags or []),
        "is_public": bool(getattr(row, "is_public", True)),
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _feed_row(row) -> dict:
    """공개 피드용 — 작성자를 특정할 수 있는 값(user_id)은 절대 넣지 않는다(익명 공개)."""
    return {
        "id": row.id,
        "image_url": row.image_url,
        "plant_name": row.plant_name,
        "matched_plant_slug": row.matched_plant_slug,
        "status": row.status,
        "headline": row.headline,
        "tags": list(row.tags or []),
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _match_plant_slug(db: Session, plant_name: str | None, scientific_name: str | None) -> str | None:
    """진단된 식물을 도감 상세페이지로 연결 — 없으면 그냥 연결을 안 걸 뿐이라 실패해도 무해.

    AI는 확신이 없을 때 "다육식물 (에케베리아로 보여요)"처럼 답하기 때문에 정확일치만
    보면 대부분 놓친다. 그래서 학명 → 이름 정확일치 → 도감 이름이 응답 문자열에 들어
    있는지(가장 긴 이름 우선) 순으로 넓혀가며 찾는다.
    """
    name = (plant_name or "").strip()
    sci = (scientific_name or "").strip()
    if not name and not sci:
        return None

    if sci:
        row = db.execute(
            text("SELECT slug FROM plants WHERE scientific_name ILIKE :sci LIMIT 1"),
            {"sci": sci},
        ).first()
        if row:
            return row[0]

    if not name:
        return None

    row = db.execute(
        text("SELECT slug FROM plants WHERE name_kr = :name LIMIT 1"), {"name": name}
    ).first()
    if row:
        return row[0]

    # "에케베리아"가 "다육식물 (에케베리아로 보여요)" 안에 들어 있는 경우.
    # 짧은 이름(예: "국화")이 관련 없는 문장에 우연히 걸리는 걸 줄이려고 2글자 이상만
    # 보고, 여러 개가 걸리면 가장 구체적인(긴) 이름을 택한다.
    row = db.execute(
        text(
            "SELECT slug FROM plants "
            "WHERE length(name_kr) >= 2 AND :name LIKE '%' || name_kr || '%' "
            "ORDER BY length(name_kr) DESC LIMIT 1"
        ),
        {"name": name},
    ).first()
    return row[0] if row else None


@app.get("/api/guides/image/{filename}")
def get_guide_image(filename: str):
    """관리자가 발행할 때 서버에서 만들어진 가드닝팁 썸네일을 백엔드가 직접 서빙.

    진단 사진과 같은 이유 — Next.js standalone은 빌드 시점 public 파일만 서빙해서,
    발행 시점에 새로 생성된 썸네일은 다음 배포 전까지 404였다(pm2 error 로그에 실제로
    "isn't a valid image ... received null"로 남아 있었음).

    저장소에 함께 커밋돼 빌드에 포함된 기존 썸네일들은 `/images/guides/...` 경로 그대로
    Next가 서빙하는 게 더 빠르므로 건드리지 않는다 — 이 경로는 '런타임 생성분'만 쓴다.
    """
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,120}\.png", filename):
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

    path = GUIDES_IMAGE_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    # 같은 slug로 다시 발행하면 내용이 바뀔 수 있어 진단 사진(immutable)보다 짧게 잡는다
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/api/diagnoses/image/{filename}")
def get_diagnosis_image(filename: str):
    """진단 사진은 백엔드가 직접 서빙한다.

    프론트의 public/ 아래에 파일을 두긴 하지만, Next.js standalone은 빌드 시점에 존재한
    public 파일만 서빙해서 런타임에 새로 쓴 파일은 404가 난다(가드닝팁 썸네일 자동생성도
    같은 이유로 다음 배포 전까지 안 보였다). nginx는 /api/ 를 이미 백엔드로 보내므로
    이 경로로 내보내면 인프라 설정을 건드리지 않고 바로 해결된다.
    """
    # 경로 조작 방지 — 저장 시 uuid4().hex + .jpg 로만 만들므로 그 형태만 허용한다
    if not re.fullmatch(r"[0-9a-f]{32}\.jpg", filename):
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

    path = DIAGNOSES_IMAGE_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    # 내용이 바뀌지 않는 파일(uuid 이름)이라 길게 캐시해도 안전
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=31536000, immutable"})


@app.get("/api/diagnoses/feed")
def list_diagnosis_feed(limit: int = 12, offset: int = 0):
    """다른 사람의 진단까지 함께 보는 공개 피드 — 로그인 없이도 볼 수 있다.

    작성자는 표시하지 않는다(익명). 사용자가 마이가든에서 내리면(is_public=false)
    즉시 빠진다. 식별 불가(unknown) 진단은 보여줄 내용이 사실상 없어 제외.

    offset은 /diagnose/all의 페이지네이션용 — 진단이 쌓여도 미리보기(홈/AI진단
    페이지)는 항상 최신 N개만 보여주고, 전체를 보고 싶으면 그 목록 페이지에서
    페이지를 넘기게 한다(한 페이지에 다 쏟아붓지 않기 위함). total을 함께 내려줘야
    프론트가 총 페이지 수를 계산할 수 있다.
    """
    limit = max(1, min(limit, 50))
    offset = max(0, offset)
    db = SessionLocal()
    try:
        total = db.execute(
            text("SELECT count(*) FROM plant_diagnoses WHERE is_public AND status <> 'unknown'")
        ).scalar_one()
        rows = db.execute(
            text(
                "SELECT id, image_url, plant_name, matched_plant_slug, status, headline, tags, created_at "
                "FROM plant_diagnoses "
                "WHERE is_public AND status <> 'unknown' "
                "ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset"
            ),
            {"limit": limit, "offset": offset},
        ).all()
        return {"items": [_feed_row(r) for r in rows], "total": total}
    finally:
        db.close()


@app.get("/api/diagnoses/{diagnosis_id}")
def get_public_diagnosis(diagnosis_id: int):
    """공개된 진단 한 건의 전체 내용 — 피드에서 눌러 들어가 실제로 읽는 화면용.

    비공개(is_public=false)면 404로 처리한다: 존재 여부 자체를 알려주지 않기 위해
    "권한 없음"이 아니라 "없음"으로 응답한다.
    (경로 선언 순서 주의 — /api/diagnoses/feed 보다 뒤에 와야 feed가 id로 먹히지 않는다)
    """
    db = SessionLocal()
    try:
        row = db.execute(
            text(
                "SELECT id, image_url, plant_name, scientific_name, matched_plant_slug, status, "
                "headline, body_html, tags, is_public, created_at FROM plant_diagnoses "
                "WHERE id = :id AND is_public"
            ),
            {"id": diagnosis_id},
        ).first()
        if not row:
            raise HTTPException(status_code=404, detail="진단을 찾을 수 없습니다.")
        # 작성자(user_id)는 조회 자체를 하지 않아 응답에 섞일 여지가 없다
        return _diagnosis_row(row)
    finally:
        db.close()


class DiagnosisVisibilityRequest(BaseModel):
    user_id: str
    is_public: bool


@app.patch("/api/me/diagnoses/{diagnosis_id}/visibility")
def update_diagnosis_visibility(diagnosis_id: int, req: DiagnosisVisibilityRequest):
    """공개 피드에 내 진단을 올릴지 내릴지 — 본인 기록만 바꿀 수 있다."""
    db = SessionLocal()
    try:
        row = db.execute(
            text(
                "UPDATE plant_diagnoses SET is_public = :pub "
                "WHERE id = :id AND user_id = :uid RETURNING id"
            ),
            {"pub": req.is_public, "id": diagnosis_id, "uid": req.user_id},
        ).first()
        if not row:
            raise HTTPException(status_code=404, detail="진단 기록을 찾을 수 없습니다.")
        db.commit()
        return {"id": row[0], "is_public": req.is_public}
    finally:
        db.close()


@app.get("/api/me/diagnoses")
def list_diagnoses(user_id: str):
    """마이가든의 'AI 진단' 탭 — 내 진단 기록(최신순) + 오늘 남은 횟수."""
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                "SELECT id, image_url, plant_name, scientific_name, matched_plant_slug, status, "
                "headline, body_html, tags, is_public, created_at FROM plant_diagnoses "
                "WHERE user_id = :uid ORDER BY created_at DESC"
            ),
            {"uid": user_id},
        ).all()
        used = _count_today_diagnoses(db, user_id)
        return {
            "items": [_diagnosis_row(r) for r in rows],
            "remaining_today": max(0, DAILY_DIAGNOSIS_LIMIT - used),
            "daily_limit": DAILY_DIAGNOSIS_LIMIT,
        }
    finally:
        db.close()


@app.post("/api/me/diagnose")
async def create_diagnosis(user_id: str = Form(...), file: UploadFile = File(...)):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="로그인이 필요합니다.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="사진을 찾을 수 없습니다.")
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="사진 용량이 너무 큽니다. 다시 시도해 주세요.")

    db = SessionLocal()
    try:
        used = _count_today_diagnoses(db, user_id)
        if used >= DAILY_DIAGNOSIS_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"오늘의 진단 {DAILY_DIAGNOSIS_LIMIT}회를 모두 사용했어요. 내일 다시 만나요.",
            )

        try:
            compressed = _compress_image(raw)
        except Exception:
            raise HTTPException(status_code=400, detail="사진을 읽을 수 없어요. 다른 사진으로 시도해 주세요.")

        try:
            result = diagnose_plant(compressed, "image/jpeg")
        except KeyError:
            # GEMINI_API_KEY 미설정 — 설정 문제지 사용자 잘못이 아니므로 502로 구분
            raise HTTPException(status_code=502, detail="진단 기능이 아직 준비되지 않았습니다.")
        except Exception:
            raise HTTPException(status_code=502, detail="진단에 실패했어요. 잠시 후 다시 시도해 주세요.")

        # AI 호출이 성공한 뒤에야 파일을 남긴다 — 실패한 시도의 사진이 쌓이지 않도록.
        DIAGNOSES_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.jpg"
        (DIAGNOSES_IMAGE_DIR / filename).write_bytes(compressed)
        # /images/... 가 아니라 /api/... 로 내보내는 이유는 get_diagnosis_image 주석 참고
        image_url = f"/api/diagnoses/image/{filename}"

        matched_slug = _match_plant_slug(db, result.get("plant_name"), result.get("scientific_name"))
        body_md = result.get("body_md") or ""
        # 조치 목록은 본문과 별개로 받아왔지만 화면에서는 본문 흐름에 이어 보여주는 게
        # 자연스러워서, 저장 시점에 마크다운으로 합쳐 하나의 글로 만든다.
        actions = [a for a in (result.get("actions") or []) if a]
        if actions:
            body_md += "\n\n## 지금 할 일\n\n" + "\n".join(f"- {a}" for a in actions)

        row = db.execute(
            text(
                "INSERT INTO plant_diagnoses "
                "(user_id, image_url, plant_name, scientific_name, matched_plant_slug, status, "
                " headline, body_md, body_html, tags) "
                "VALUES (:uid, :img, :name, :sci, :slug, :status, :headline, :md, :html, :tags) "
                "RETURNING id, image_url, plant_name, scientific_name, matched_plant_slug, status, "
                "          headline, body_html, tags, is_public, created_at"
            ),
            {
                "uid": user_id,
                "img": image_url,
                "name": result.get("plant_name"),
                "sci": result.get("scientific_name") or None,
                "slug": matched_slug,
                "status": result.get("status"),
                "headline": result.get("headline"),
                "md": body_md,
                "html": to_html(body_md),
                "tags": list(result.get("tags") or []),
            },
        ).one()
        db.commit()

        return {
            **_diagnosis_row(row),
            "remaining_today": max(0, DAILY_DIAGNOSIS_LIMIT - used - 1),
            "daily_limit": DAILY_DIAGNOSIS_LIMIT,
        }
    finally:
        db.close()


@app.delete("/api/me/diagnoses/{diagnosis_id}")
def delete_diagnosis(diagnosis_id: int, user_id: str):
    """내 기록만 지울 수 있게 user_id를 조건에 함께 넣는다(남의 id를 넣어도 0건 삭제)."""
    db = SessionLocal()
    try:
        row = db.execute(
            text("SELECT image_url FROM plant_diagnoses WHERE id = :id AND user_id = :uid"),
            {"id": diagnosis_id, "uid": user_id},
        ).first()
        if not row:
            raise HTTPException(status_code=404, detail="진단 기록을 찾을 수 없습니다.")

        db.execute(
            text("DELETE FROM plant_diagnoses WHERE id = :id AND user_id = :uid"),
            {"id": diagnosis_id, "uid": user_id},
        )
        db.commit()

        # 파일 삭제는 실패해도 무시 — DB에서 지워진 이상 화면에는 안 나오고,
        # 고아 파일 하나 때문에 사용자에게 오류를 보여줄 이유가 없다.
        try:
            (DIAGNOSES_IMAGE_DIR / Path(row[0]).name).unlink(missing_ok=True)
        except OSError:
            pass
        return {"deleted": True}
    finally:
        db.close()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
