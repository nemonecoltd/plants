const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export interface PlantSummary {
  slug: string;
  name_kr: string;
  name_en: string | null;
  category: string | null;
  tags: string[] | null;
  difficulty: string | null;
  sunlight: string | null;
  watering_level: string | null;
  image_urls: string[] | null;
  updated_at: string | null;
}

export interface PlantDetail extends PlantSummary {
  scientific_name: string | null;
  planting_months: number[] | null;
  bloom_months: number[] | null;
  soil_type: string[] | null;
  hardiness_zone: number | null;
  min_temp_c: number | null;
  description: string | null;
  source: string | null;
}

// 서버 컴포넌트 전용 fetch — msm의 lib/internalApi.ts와 동일하게 캐시를 꺼서
// 로컬 개발 중 데이터가 오래된 채로 굳어 보이는 문제를 방지한다.
async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPlants(): Promise<PlantSummary[]> {
  const data = await fetchApi<{ items: PlantSummary[] }>("/api/plants");
  return data?.items ?? [];
}

export async function getPlant(slug: string): Promise<PlantDetail | null> {
  return fetchApi<PlantDetail>(`/api/plants/${slug}`);
}
