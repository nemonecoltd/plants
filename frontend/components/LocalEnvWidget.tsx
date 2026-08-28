import { headers } from "next/headers";
import PlantCard from "@/components/PlantCard";
import type { PlantSummary } from "@/lib/api";

// 비회원에게도 "이 서비스가 나를 알아본다"는 인상을 주기 위한 위젯이라 정확한 원예학적
// 근거보다는 체감 상 그럴듯한 추천이면 충분함(토양 pH처럼 정밀한 지표는 다루지 않음).
interface GeoInfo {
  city: string;
  region: string;
  lat: number;
  lon: number;
}

// ipwho.is는 한국어 지명을 지원하지 않아 영문으로만 내려옴 — 주요 도시/광역단위만
// 한글로 매핑하고, 없으면 영문 그대로 보여준다(치명적이지 않은 표시용 정보라 완전한
// 커버리지보다 흔한 지역 위주로 커버).
const KOREAN_PLACE_NAMES: Record<string, string> = {
  Seoul: "서울", Busan: "부산", Incheon: "인천", Daegu: "대구", Daejeon: "대전",
  Gwangju: "광주", Ulsan: "울산", Sejong: "세종",
  Suwon: "수원", Seongnam: "성남", Goyang: "고양", Yongin: "용인", Bucheon: "부천",
  Ansan: "안산", Anyang: "안양", Namyangju: "남양주", Hwaseong: "화성", Pyeongtaek: "평택",
  Uijeongbu: "의정부", Paju: "파주", Gimpo: "김포", Gwangmyeong: "광명", Gunpo: "군포",
  Icheon: "이천", Yangju: "양주", Osan: "오산", Guri: "구리", Anseong: "안성",
  Pocheon: "포천", Uiwang: "의왕", Hanam: "하남", Yeoju: "여주", Gwacheon: "과천",
  Chuncheon: "춘천", Wonju: "원주", Gangneung: "강릉",
  Cheongju: "청주", Chungju: "충주", Cheonan: "천안", Asan: "아산", Seosan: "서산",
  Jeonju: "전주", Iksan: "익산", Gunsan: "군산", Mokpo: "목포", Yeosu: "여수", Suncheon: "순천",
  Gimhae: "김해", Changwon: "창원", Jinju: "진주", Pohang: "포항", Gyeongju: "경주",
  Gumi: "구미", Andong: "안동", Jeju: "제주",
  "Gyeonggi-do": "경기도", "Gangwon-do": "강원도", "Gangwon State": "강원도",
  "Chungcheongbuk-do": "충청북도", "Chungcheongnam-do": "충청남도",
  "Jeollabuk-do": "전라북도", "Jeollanam-do": "전라남도",
  "Gyeongsangbuk-do": "경상북도", "Gyeongsangnam-do": "경상남도",
  "Jeju-do": "제주도", "Jeju Special Self-Governing Province": "제주도",
};

function localizeCity(geo: GeoInfo): string {
  return KOREAN_PLACE_NAMES[geo.city] ?? KOREAN_PLACE_NAMES[geo.region] ?? geo.city;
}

// 한글 마지막 글자의 받침 유무로 은/는을 고른다(외국 도시명 등 한글이 아니면 "는" 기본값).
function eunNeun(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "는";
  return (code - 0xac00) % 28 !== 0 ? "은" : "는";
}

interface WeatherInfo {
  temp: number;
  humidity: number;
}

interface CacheEntry {
  geo: GeoInfo | null;
  weather: WeatherInfo | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

async function geolocateIp(ip: string): Promise<GeoInfo | null> {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.city || typeof data.latitude !== "number") return null;
    return { city: data.city, region: data.region ?? data.city, lat: data.latitude, lon: data.longitude };
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    const humidity = data?.current?.relative_humidity_2m;
    if (typeof temp !== "number" || typeof humidity !== "number") return null;
    return { temp, humidity };
  } catch {
    return null;
  }
}

async function resolveEnv(ip: string): Promise<{ geo: GeoInfo | null; weather: WeatherInfo | null }> {
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return { geo: cached.geo, weather: cached.weather };
  }
  const geo = await geolocateIp(ip);
  const weather = geo ? await fetchWeather(geo.lat, geo.lon) : null;
  cache.set(ip, { geo, weather, expiresAt: Date.now() + CACHE_TTL_MS });
  return { geo, weather };
}

function tempTier(temp: number): "cold" | "mild" | "hot" {
  if (temp < 5) return "cold";
  if (temp >= 26) return "hot";
  return "mild";
}

function humidityTier(humidity: number): "dry" | "moderate" | "wet" {
  if (humidity < 40) return "dry";
  if (humidity >= 65) return "wet";
  return "moderate";
}

function buildMessage(city: string, temp: number, humidity: number): string {
  const t = tempTier(temp);
  const h = humidityTier(humidity);
  const josa = eunNeun(city);
  if (t === "cold") return `${city}${josa} 지금 쌀쌀해요. 추위에 강한 식물이 관리하기 편해요.`;
  if (t === "hot" && h === "wet") return `${city}${josa} 지금 덥고 습해요. 물빠짐 좋은 환경이 중요한 시기예요.`;
  if (t === "hot") return `${city}${josa} 지금 더운 편이에요. 물을 자주 필요로 하는 식물을 챙겨주세요.`;
  if (h === "wet") return `${city}${josa} 지금 습도가 높아요. 과습에 강한 식물을 추천해요.`;
  if (h === "dry") return `${city}${josa} 지금 건조해요. 습도를 좋아하는 식물이 잘 맞아요.`;
  return `${city}${josa} 지금 딱 무난한 날씨예요. 초보자도 키우기 쉬운 식물을 골라봤어요.`;
}

function pickRecommendations(plants: PlantSummary[], temp: number, humidity: number): PlantSummary[] {
  const t = tempTier(temp);
  const h = humidityTier(humidity);

  const scored = plants.map((p) => {
    let score = 0;
    if (t === "cold" && p.min_temp_c !== null && p.min_temp_c <= -10) score += 2;
    if (t === "hot" && p.watering_level === "wet") score += 2;
    if (t === "mild" && p.difficulty && ["easy", "쉬움"].includes(p.difficulty)) score += 1;
    if (h === "wet" && p.watering_level === "dry") score += 2;
    if (h === "dry" && p.watering_level === "wet") score += 1;
    if (h === "moderate" && p.watering_level === "moderate") score += 1;
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  // 같은 카테고리가 몰리지 않도록 다양성 확보
  const seen = new Set<string>();
  const picked: PlantSummary[] = [];
  for (const { p } of scored) {
    const key = p.category ?? p.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(p);
    if (picked.length >= 4) break;
  }
  return picked;
}

export default async function LocalEnvWidget({ plants }: { plants: PlantSummary[] }) {
  const ip = await clientIp();
  if (!ip || ip.startsWith("127.") || ip === "::1") return null;

  const { geo, weather } = await resolveEnv(ip);
  if (!geo || !weather) return null;

  const recommendations = pickRecommendations(plants, weather.temp, weather.humidity);
  if (recommendations.length === 0) return null;

  const cityName = localizeCity(geo);

  return (
    <section className="py-8 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-plant-secondary">📍 {cityName}</span>
        <span className="text-xs text-gray-400">
          지금 {Math.round(weather.temp)}°C · 습도 {Math.round(weather.humidity)}%
        </span>
      </div>
      <h2 className="text-lg font-bold text-plant-primary mb-4">{buildMessage(cityName, weather.temp, weather.humidity)}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recommendations.map((p) => (
          <PlantCard key={p.slug} plant={p} />
        ))}
      </div>
    </section>
  );
}
