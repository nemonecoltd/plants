"""1차 시드 데이터 — 실제 식물 정보(실존 종, 정확한 관리법)로 채운 최소 데이터셋.
사진(image_urls)은 정확한 출처를 확신할 수 없어 비워둠 — 추후 6번 항목의 공공데이터/Perenual
API 연동 시 실사진으로 채울 예정. 지금은 메인/상세 페이지 동작 확인이 목적."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/nemone_plants")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

PLANTS = [
    dict(
        slug="monstera-deliciosa", name_kr="몬스테라", name_en="Swiss cheese plant",
        scientific_name="Monstera deliciosa", category="관엽식물",
        tags=["공기정화", "인테리어", "반려식물"], planting_months=[4, 5, 6],
        bloom_months=[], watering_level="moderate", sunlight="part_shade",
        soil_type=["배수 좋은 흙"], hardiness_zone=10, min_temp_c=10, difficulty="easy",
        description="잎에 큰 구멍(천공)이 생기는 대표적인 관엽식물. 강한 직사광선을 피한 밝은 간접광에서 잘 자라며, 겉흙이 마르면 물을 주는 정도로 관리가 쉬워 초보자에게 추천된다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="sansevieria-trifasciata", name_kr="산세베리아", name_en="Snake plant",
        scientific_name="Dracaena trifasciata", category="관엽식물",
        tags=["공기정화", "저관리", "다육"], planting_months=[5, 6, 7],
        bloom_months=[], watering_level="dry", sunlight="full_shade",
        soil_type=["다육식물용 배수토"], hardiness_zone=9, min_temp_c=8, difficulty="easy",
        description="건조에 매우 강해 물을 자주 주지 않아도 되는 대표적인 저관리 식물. 야간 산소 배출 식물로도 알려져 있으며 어두운 실내에서도 비교적 잘 견딘다. 과습이 가장 흔한 실패 원인.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="pachira-aquatica", name_kr="파키라", name_en="Money tree",
        scientific_name="Pachira aquatica", category="관엽식물",
        tags=["개업선물", "인테리어"], planting_months=[4, 5], bloom_months=[],
        watering_level="moderate", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=10, min_temp_c=12, difficulty="easy",
        description="줄기를 꼬아 기르는 모습으로 개업·이사 선물에 자주 쓰인다. 밝은 간접광을 좋아하고, 겉흙이 마른 뒤 충분히 물을 주는 방식이 적합하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="zamioculcas-zamiifolia", name_kr="금전수", name_en="ZZ plant",
        scientific_name="Zamioculcas zamiifolia", category="관엽식물",
        tags=["공기정화", "저관리"], planting_months=[5, 6], bloom_months=[],
        watering_level="dry", sunlight="full_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=9, min_temp_c=10, difficulty="easy",
        description="두꺼운 뿌리줄기(구근)에 수분을 저장해 물을 자주 안 줘도 되는 극강의 저관리 식물. 광량이 적은 사무실 환경에서도 잘 견뎌 인테리어용으로 인기가 많다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="spathiphyllum", name_kr="스파티필럼", name_en="Peace lily",
        scientific_name="Spathiphyllum wallisii", category="관엽식물",
        tags=["공기정화", "개화식물"], planting_months=[4, 5], bloom_months=[5, 6, 7, 8],
        watering_level="moderate", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=11, min_temp_c=13, difficulty="medium",
        description="흰색 불염포 모양의 꽃이 피는 공기정화 식물. 물이 부족하면 잎이 눈에 띄게 처지기 때문에 물 주는 시기를 알기 쉽지만, 반대로 과습에는 약하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="ficus-elastica", name_kr="고무나무", name_en="Rubber plant",
        scientific_name="Ficus elastica", category="관엽식물",
        tags=["공기정화", "인테리어"], planting_months=[4, 5, 6], bloom_months=[],
        watering_level="moderate", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=10, min_temp_c=12, difficulty="easy",
        description="두껍고 광택 있는 잎이 특징인 대형 관엽식물. 성장이 빨라 큰 사이즈로 키우기 좋고, 직사광선보다는 밝은 간접광을 선호한다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="echeveria", name_kr="에케베리아", name_en="Echeveria",
        scientific_name="Echeveria spp.", category="다육식물",
        tags=["다육", "저관리", "소형"], planting_months=[3, 4, 9, 10], bloom_months=[4, 5],
        watering_level="dry", sunlight="full_sun", soil_type=["다육식물용 배수토"],
        hardiness_zone=9, min_temp_c=5, difficulty="easy",
        description="장미 모양으로 잎이 겹쳐 자라는 다육식물의 대표 속. 강한 햇빛과 통풍을 좋아하며, 물은 흙이 완전히 마른 뒤 듬뿍 주는 방식이 적합하다. 과습에 매우 약하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="opuntia", name_kr="선인장(부채선인장)", name_en="Prickly pear cactus",
        scientific_name="Opuntia spp.", category="다육식물",
        tags=["다육", "저관리"], planting_months=[4, 5, 6], bloom_months=[6, 7],
        watering_level="dry", sunlight="full_sun", soil_type=["선인장용 배수토"],
        hardiness_zone=9, min_temp_c=0, difficulty="easy",
        description="편평한 부채 모양 마디가 특징인 선인장. 건조에 극도로 강하고 강한 햇빛을 필요로 하며, 겨울철에는 거의 물을 주지 않아도 된다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="anthurium-andraeanum", name_kr="안스리움", name_en="Flamingo flower",
        scientific_name="Anthurium andraeanum", category="관엽식물",
        tags=["개화식물", "인테리어"], planting_months=[4, 5], bloom_months=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        watering_level="moderate", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=11, min_temp_c=15, difficulty="medium",
        description="붉은색·분홍색의 광택 있는 불염포가 사계절 피는 관상용 식물. 고온다습한 환경을 좋아해 실내 습도 관리가 필요하고, 추위에 약해 겨울철 실내온도 유지가 중요하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="nephrolepis-exaltata", name_kr="보스턴고사리", name_en="Boston fern",
        scientific_name="Nephrolepis exaltata", category="관엽식물",
        tags=["공기정화", "습도선호"], planting_months=[4, 5], bloom_months=[],
        watering_level="wet", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=9, min_temp_c=10, difficulty="medium",
        description="깃털처럼 늘어지는 잎이 매력적인 양치식물. 건조한 실내 공기에 약해 자주 분무해주거나 습도가 높은 욕실 등에서 잘 자란다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="ulmus-parvifolia-yulma", name_kr="율마", name_en="Cupressus (common name 'Yulma' in Korea)",
        scientific_name="Cupressus macrocarpa 'Goldcrest'", category="정원수",
        tags=["향기", "크리스마스트리"], planting_months=[3, 4, 10, 11], bloom_months=[],
        watering_level="moderate", sunlight="full_sun", soil_type=["배수 좋은 흙"],
        hardiness_zone=8, min_temp_c=-5, difficulty="medium",
        description="레몬향이 나는 잎이 특징으로 국내에서 크리스마스트리 대용으로 인기 있는 침엽수. 통풍이 안 되고 과습하면 갈변하며 죽기 쉬워 관리 난이도는 중간 이상.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="rosa-hybrid", name_kr="장미", name_en="Rose",
        scientific_name="Rosa × hybrida", category="정원식물",
        tags=["개화식물", "정원", "향기"], planting_months=[3, 4, 10, 11], bloom_months=[5, 6, 9, 10],
        watering_level="moderate", sunlight="full_sun", soil_type=["비옥한 배수토"],
        hardiness_zone=6, min_temp_c=-15, difficulty="hard",
        description="봄과 가을에 개화하는 대표적인 정원 관상화. 하루 6시간 이상의 충분한 일조량과 통풍이 필요하며, 병충해(흑반병·진딧물) 관리가 까다로운 편이다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="tulipa-gesneriana", name_kr="튤립", name_en="Tulip",
        scientific_name="Tulipa gesneriana", category="구근식물",
        tags=["개화식물", "구근", "봄꽃"], planting_months=[10, 11], bloom_months=[3, 4],
        watering_level="moderate", sunlight="full_sun", soil_type=["배수 좋은 흙"],
        hardiness_zone=4, min_temp_c=-25, difficulty="medium",
        description="가을에 구근을 심어 이듬해 봄에 꽃을 피우는 대표적인 구근식물. 겨울철 저온을 거쳐야 개화하므로 국내 노지 재배에 적합하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="chrysanthemum", name_kr="국화", name_en="Chrysanthemum",
        scientific_name="Chrysanthemum × morifolium", category="정원식물",
        tags=["개화식물", "가을꽃"], planting_months=[4, 5], bloom_months=[9, 10, 11],
        watering_level="moderate", sunlight="full_sun", soil_type=["배수 좋은 흙"],
        hardiness_zone=5, min_temp_c=-15, difficulty="medium",
        description="가을을 대표하는 개화식물로 일조시간이 짧아지면 꽃눈이 생기는 단일식물. 다양한 품종과 색상이 있어 화단·화분 모두에 널리 쓰인다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="prunus-serrulata", name_kr="벚나무", name_en="Cherry blossom",
        scientific_name="Prunus serrulata", category="정원수",
        tags=["봄꽃", "가로수", "낙엽수"], planting_months=[3, 11], bloom_months=[4],
        watering_level="moderate", sunlight="full_sun", soil_type=["배수 좋은 흙"],
        hardiness_zone=6, min_temp_c=-20, difficulty="medium",
        description="4월 초 일제히 개화하는 국내 대표 봄꽃나무. 어릴 때는 관리가 비교적 쉽지만 자라면서 병충해(빗자루병 등) 방제가 필요해진다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="pinus-densiflora", name_kr="소나무", name_en="Korean red pine",
        scientific_name="Pinus densiflora", category="정원수",
        tags=["침엽수", "사계절", "정원"], planting_months=[3, 4, 10, 11], bloom_months=[],
        watering_level="dry", sunlight="full_sun", soil_type=["배수 좋은 흙"],
        hardiness_zone=4, min_temp_c=-30, difficulty="hard",
        description="한국 전통 정원과 산림을 대표하는 상록침엽수. 척박한 토양에서도 잘 자라지만 대형목 이식과 전정(가지치기)에는 전문 기술이 필요하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="lavandula-angustifolia", name_kr="라벤더", name_en="English lavender",
        scientific_name="Lavandula angustifolia", category="허브",
        tags=["허브", "향기", "개화식물"], planting_months=[4, 5], bloom_months=[6, 7],
        watering_level="dry", sunlight="full_sun", soil_type=["배수 좋은 알칼리성 흙"],
        hardiness_zone=5, min_temp_c=-15, difficulty="medium",
        description="보라색 꽃과 향기로 유명한 허브. 배수가 잘 되는 건조한 환경을 좋아해 과습한 국내 장마철 관리가 관건이다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="mentha", name_kr="민트", name_en="Mint",
        scientific_name="Mentha spp.", category="허브",
        tags=["허브", "식용", "저관리"], planting_months=[4, 5, 6], bloom_months=[7, 8],
        watering_level="wet", sunlight="part_shade", soil_type=["배수 좋은 흙"],
        hardiness_zone=4, min_temp_c=-20, difficulty="easy",
        description="번식력이 매우 강해 초보자도 쉽게 기를 수 있는 허브. 뿌리로 빠르게 퍼지는 특성이 있어 화단에 직접 심을 경우 번짐 방지 조치가 필요하다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="ocimum-basilicum", name_kr="바질", name_en="Basil",
        scientific_name="Ocimum basilicum", category="허브",
        tags=["허브", "식용"], planting_months=[5, 6], bloom_months=[7, 8],
        watering_level="moderate", sunlight="full_sun", soil_type=["비옥한 배수토"],
        hardiness_zone=10, min_temp_c=10, difficulty="easy",
        description="이탈리아 요리에 많이 쓰이는 대표적인 식용 허브. 추위에 약해 국내에서는 노지 월동이 안 되고 봄에 파종해 여름에 수확하는 한해살이로 재배한다.",
        image_urls=[], source="manual",
    ),
    dict(
        slug="lycopersicon-esculentum", name_kr="방울토마토", name_en="Cherry tomato",
        scientific_name="Solanum lycopersicum var. cerasiforme", category="텃밭작물",
        tags=["텃밭", "식용", "여름"], planting_months=[4, 5], bloom_months=[6, 7, 8],
        watering_level="moderate", sunlight="full_sun", soil_type=["비옥한 배수토"],
        hardiness_zone=10, min_temp_c=10, difficulty="medium",
        description="베란다 텃밭에서 가장 인기 있는 작물 중 하나. 지지대가 필요하고 곁순 제거 등 관리가 필요하지만 초보자도 수확의 재미를 느끼기 쉽다.",
        image_urls=[], source="manual",
    ),
]


def seed():
    with Session() as db:
        for p in PLANTS:
            db.execute(
                text(
                    """
                    INSERT INTO plants
                        (slug, name_kr, name_en, scientific_name, category, tags,
                         planting_months, bloom_months, watering_level, sunlight,
                         soil_type, hardiness_zone, min_temp_c, difficulty,
                         description, image_urls, source)
                    VALUES
                        (:slug, :name_kr, :name_en, :scientific_name, :category, :tags,
                         :planting_months, :bloom_months, :watering_level, :sunlight,
                         :soil_type, :hardiness_zone, :min_temp_c, :difficulty,
                         :description, :image_urls, :source)
                    ON CONFLICT (slug) DO UPDATE SET
                        name_kr = EXCLUDED.name_kr,
                        name_en = EXCLUDED.name_en,
                        scientific_name = EXCLUDED.scientific_name,
                        category = EXCLUDED.category,
                        tags = EXCLUDED.tags,
                        planting_months = EXCLUDED.planting_months,
                        bloom_months = EXCLUDED.bloom_months,
                        watering_level = EXCLUDED.watering_level,
                        sunlight = EXCLUDED.sunlight,
                        soil_type = EXCLUDED.soil_type,
                        hardiness_zone = EXCLUDED.hardiness_zone,
                        min_temp_c = EXCLUDED.min_temp_c,
                        difficulty = EXCLUDED.difficulty,
                        description = EXCLUDED.description,
                        image_urls = EXCLUDED.image_urls,
                        source = EXCLUDED.source,
                        updated_at = now()
                    """
                ),
                p,
            )
        db.commit()
    print(f"완료: {len(PLANTS)}종 시드 upsert")


if __name__ == "__main__":
    seed()
