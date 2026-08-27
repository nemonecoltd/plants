"""NEMONE PLANTS 백엔드 — matmatch/now_back과 동일하게 FastAPI + 동기 SQLAlchemy(psycopg2) 사용.
1차 착수 범위: 메인페이지(목록) + 상세페이지만 동작하면 되므로 plants 테이블 하나만 다룬다."""
import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import ARRAY, Column, DateTime, Integer, String, Text, create_engine, func
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv(".env.local")

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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
