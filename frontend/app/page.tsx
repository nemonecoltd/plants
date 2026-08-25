import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { getPlants } from "@/lib/api";

const SUNLIGHT_LABEL: Record<string, string> = {
  full_sun: "양지",
  part_shade: "반음지",
  full_shade: "음지",
};

const SITE_URL = "https://plants.nemoneai.com";

export default async function Home() {
  const plants = await getPlants();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: plants.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/plants/${p.slug}`,
      name: p.name_kr,
    })),
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-plant-primary text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">식물도감 &amp; 케어 가이드</h1>
          <p className="text-white/80 text-sm">계절과 지역에 맞는 식물을 찾고, 정확한 관리법을 확인하세요.</p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-bold text-plant-primary mb-4">전체 식물 ({plants.length})</h2>

        {plants.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 식물이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {plants.map((p) => (
              <Link
                key={p.slug}
                href={`/plants/${p.slug}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-plant-primary hover:shadow-md transition-all no-underline"
              >
                <div className="text-[11px] text-plant-secondary mb-1">{p.category}</div>
                <div className="font-bold text-plant-primary mb-1">{p.name_kr}</div>
                {p.name_en && <div className="text-[11px] text-gray-400 italic mb-2">{p.name_en}</div>}
                <div className="flex flex-wrap gap-1">
                  {p.sunlight && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
                      {SUNLIGHT_LABEL[p.sunlight] ?? p.sunlight}
                    </span>
                  )}
                  {p.difficulty && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
                      난이도 {p.difficulty}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      </main>
    </div>
  );
}
