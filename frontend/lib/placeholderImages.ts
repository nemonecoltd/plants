// 임시 실사 이미지 매핑 — Wikimedia Commons(CC 라이선스)에서 조달, 화면 껍데기 검토용.
// plants 테이블의 image_urls와는 별개(아직 DB 파이프라인에 안 붙어있음). 정식 데이터
// 소스(농사로 API 등)가 붙으면 이 파일은 제거하고 DB의 image_urls를 그대로 쓰면 된다.
// 출처는 public/images/plants/credits.json 참고.
const PLACEHOLDER_IMAGES: Record<string, string> = {
  "monstera-deliciosa": "/images/plants/monstera-deliciosa.jpg",
  "sansevieria-trifasciata": "/images/plants/sansevieria-trifasciata.jpg",
  "pachira-aquatica": "/images/plants/pachira-aquatica.jpg",
  "zamioculcas-zamiifolia": "/images/plants/zamioculcas-zamiifolia.jpg",
  spathiphyllum: "/images/plants/spathiphyllum.jpg",
  "ficus-elastica": "/images/plants/ficus-elastica.jpg",
  echeveria: "/images/plants/echeveria.jpg",
  opuntia: "/images/plants/opuntia.jpg",
  "anthurium-andraeanum": "/images/plants/anthurium-andraeanum.jpg",
  "nephrolepis-exaltata": "/images/plants/nephrolepis-exaltata.jpg",
  "rosa-hybrid": "/images/plants/rosa-hybrid.jpg",
  "tulipa-gesneriana": "/images/plants/tulipa-gesneriana.jpg",
  chrysanthemum: "/images/plants/chrysanthemum.jpg",
  "prunus-serrulata": "/images/plants/prunus-serrulata.jpg",
  "pinus-densiflora": "/images/plants/pinus-densiflora.jpg",
  "lavandula-angustifolia": "/images/plants/lavandula-angustifolia.jpg",
  mentha: "/images/plants/mentha.jpg",
  "ocimum-basilicum": "/images/plants/ocimum-basilicum.jpg",
  "lycopersicon-esculentum": "/images/plants/lycopersicon-esculentum.jpg",
  "ulmus-parvifolia-yulma": "/images/plants/ulmus-parvifolia-yulma.jpg",
};

export function getPlaceholderImage(slug: string): string | null {
  return PLACEHOLDER_IMAGES[slug] ?? null;
}

export const HERO_IMAGE = "/images/plants/hero.jpg";
