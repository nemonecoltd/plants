"""NEMONE PLANTS 백엔드 — matmatch/now_back과 동일하게 FastAPI + 동기 SQLAlchemy(psycopg2) 사용.
1차 착수 범위: 메인페이지(목록) + 상세페이지만 동작하면 되므로 plants 테이블 하나만 다룬다."""
import os
from datetime import datetime, timedelta, timezone

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import ARRAY, Column, DateTime, Integer, String, Text, create_engine, func, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

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
        "published_at": g.published_at.isoformat() if g.published_at else None,
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
