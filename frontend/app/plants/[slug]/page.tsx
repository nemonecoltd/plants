import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import { getPlant } from "@/lib/api";

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

export default async function PlantDetailPage({ params }: Props) {
  const { slug } = await params;
  const plant = await getPlant(slug);

  if (!plant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <header className="bg-plant-primary text-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/" className="text-white/70 text-xs no-underline hover:text-white">
            ← 전체 식물 목록
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
