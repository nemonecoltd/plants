import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import { getPlant } from "@/lib/api";
import { getPlantImage } from "@/lib/placeholderImages";

const SITE_URL = "https://plants.nemoneai.com";

const SUNLIGHT_LABEL: Record<string, string> = {
  full_sun: "양지",
  part_shade: "반음지",
  full_shade: "음지",
};
const WATERING_LABEL: Record<string, string> = {
  dry: "건조하게(겉흙 마르면)",
  moderate: "보통",
  wet: "습하게(자주)",
};
const MONTH_LABEL = (m: number) => `${m}월`;

interface Props {
  params: Promise<{ slug: string }>;
}

// description이 없는(아직 관리정보가 안 채워진) 항목도 최소한의 고유한 메타디스크립션을
// 갖도록 케어 요약 문장으로 폴백 — 전 페이지 description이 똑같으면 중복 콘텐츠로 잡힘.
function buildDescription(plant: NonNullable<Awaited<ReturnType<typeof getPlant>>>): string {
  if (plant.description) return plant.description.slice(0, 150);
  const facts: string[] = [];
  if (plant.sunlight) facts.push(`${SUNLIGHT_LABEL[plant.sunlight] ?? plant.sunlight} 선호`);
  if (plant.watering_level) facts.push(`물주기 ${WATERING_LABEL[plant.watering_level] ?? plant.watering_level}`);
  if (plant.difficulty) facts.push(`난이도 ${plant.difficulty}`);
  const suffix = facts.length ? facts.join(" · ") : "정확한 학명·분류 정보";
  return `${plant.name_kr}(${plant.scientific_name ?? plant.name_en ?? ""}) 키우는 법 — ${suffix}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPlant(slug);
  if (!plant) {
    return { title: "식물 정보" };
  }

  const label = plant.name_en ? `${plant.name_kr}(${plant.name_en})` : plant.name_kr;
  const title = `${label} 키우는 법 · 특징`;
  const description = buildDescription(plant);
  const url = `${SITE_URL}/plants/${slug}`;
  const image = getPlantImage(plant);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "ko_KR",
      siteName: "NEMONE PLANTS",
      images: image ? [image] : undefined,
    },
    twitter: image ? { card: "summary_large_image", title, description, images: [image] } : undefined,
  };
}

export default async function PlantDetailPage({ params }: Props) {
  const { slug } = await params;
  const plant = await getPlant(slug);

  if (!plant) {
    notFound();
  }

  const image = getPlantImage(plant);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${plant.name_kr} 키우는 법 · 특징`,
    description: buildDescription(plant),
    mainEntityOfPage: `${SITE_URL}/plants/${slug}`,
    about: {
      "@type": "Taxon",
      name: plant.name_kr,
      alternateName: plant.name_en ?? undefined,
      scientificName: plant.scientific_name ?? undefined,
    },
    author: { "@type": "Organization", name: "NEMONE PLANTS", url: SITE_URL },
    publisher: { "@type": "Organization", name: "NEMONE PLANTS", url: SITE_URL },
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/" className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4">
          ← 전체 식물 목록
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {image && (
            <div className="relative aspect-[16/9]">
              <Image src={image} alt={plant.name_kr} fill className="object-cover" priority />
            </div>
          )}
          <div className="p-6">
          <div className="text-xs text-plant-secondary mb-1">{plant.category}</div>
          <h1 className="text-2xl font-bold text-plant-primary mb-1">{plant.name_kr}</h1>
          {(plant.name_en || plant.scientific_name) && (
            <div className="text-sm text-gray-400 italic mb-4">
              {plant.name_en} {plant.scientific_name ? `· ${plant.scientific_name}` : ""}
            </div>
          )}

          {plant.tags && plant.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {plant.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-plant-secondary/15 text-plant-primary">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <Stat label="난이도" value={plant.difficulty ?? "-"} />
            <Stat label="빛" value={plant.sunlight ? SUNLIGHT_LABEL[plant.sunlight] ?? plant.sunlight : "-"} />
            <Stat label="물주기" value={plant.watering_level ? WATERING_LABEL[plant.watering_level] ?? plant.watering_level : "-"} />
            <Stat
              label="심는 시기"
              value={plant.planting_months?.length ? plant.planting_months.map(MONTH_LABEL).join(", ") : "-"}
            />
            <Stat
              label="개화 시기"
              value={plant.bloom_months?.length ? plant.bloom_months.map(MONTH_LABEL).join(", ") : "-"}
            />
            <Stat label="최저 견딜 온도" value={plant.min_temp_c != null ? `${plant.min_temp_c}°C` : "-"} />
          </div>

          {plant.description && (
            <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
              {plant.description}
            </p>
          )}

          {plant.source === "nongsaro" && (
            <p className="text-[11px] text-gray-400 text-right mt-3">
              {"<출처 : 농사로(농촌진흥청) 제공>"}
            </p>
          )}
          </div>
        </div>

        <div className="mt-6">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F4F6F4] rounded p-2.5">
      <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-plant-primary">{value}</div>
    </div>
  );
}
