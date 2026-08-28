import Image from "next/image";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import LocalEnvWidget from "@/components/LocalEnvWidget";
import MonthlyPlantSection from "@/components/MonthlyPlantSection";
import { getGuides, getPlants } from "@/lib/api";
import type { GuideSummary } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

// 랜덤으로 뽑다 보면 같은 카테고리(예: 채소)가 3개 중 2~3개를 차지해 다양성이
// 떨어지는 경우가 있어, 카테고리당 최대 1개만 뽑히도록 제한
function pickDiverseGuides(guides: GuideSummary[], count: number): GuideSummary[] {
  const shuffled = [...guides].sort(() => Math.random() - 0.5);
  const seen = new Set<string>();
  const picked: GuideSummary[] = [];
  for (const g of shuffled) {
    const key = g.category ?? `__uncategorized_${g.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(g);
    if (picked.length >= count) break;
  }
  return picked;
}

export default async function Home() {
  const [plants, guides] = await Promise.all([getPlants(), getGuides()]);
  const recentGuides = guides.slice(0, 3);
  // 상단 노출용 랜덤 3개(1개 크게 + 2개 가로, 카테고리 중복 없이) — 매 요청마다
  // 다른 팁을 보여줘 반복 방문 시에도 신선하게 느껴지도록 함
  const highlightGuides = pickDiverseGuides(guides, 3);
  const categories = [...new Set(plants.map((p) => p.category).filter(Boolean))] as string[];
  const currentMonth = new Date().getMonth() + 1;

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

      {/* 화면에는 안 보이지만 페이지 정체성을 위해 h1은 유지(SEO/접근성) */}
      <h1 className="sr-only">식물도감 &amp; 식물집사 케어 가이드 — 저장하고 개화·파종 시기 알림받기</h1>

      {/* ── 가드닝팁 하이라이트(랜덤 3개: 왼쪽 1개 크게 + 오른쪽 2개 가로) ── */}
      {highlightGuides.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-plant-primary">🌱 오늘의 가드닝팁</h2>
            <Link href="/guide" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
              전체보기 →
            </Link>
          </div>
          {/* 모바일은 카드 1개만(작은 카드 2개는 너무 좁아져 가독성이 떨어짐),
              데스크톱은 기존대로 왼쪽 큰 카드 + 오른쪽 작은 카드 2개 */}
          <div className="flex flex-row gap-3">
            <HeroGuideCard guide={highlightGuides[0]} className="h-56 sm:h-72 w-full sm:w-1/2" titleClassName="text-base sm:text-lg" />
            {highlightGuides.length > 1 && (
              <div className="hidden sm:flex gap-3 sm:w-1/2 h-72">
                {highlightGuides.slice(1, 3).map((g) => (
                  <HeroGuideCard key={g.slug} guide={g} className="flex-1 h-full" titleClassName="text-xs sm:text-sm" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 오늘의 가드닝팁 바로 아래 광고 — PC/모바일 모두 세로로 커지지 않는 슬림한 가로형 ── */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <AdBanner dataAdSlot="6819394440" variant="horizontal-slim" />
      </section>

      <main className="max-w-5xl mx-auto px-6">
        {/* ── 지역 환경 위젯(IP 기반, 비회원도 노출) — 온도/습도에 맞는 식물 추천 ── */}
        <LocalEnvWidget plants={plants} />

        {/* ── 월별 퀵필터(실제 클릭 가능) + 이번 달 개화 식물 ── */}
        <MonthlyPlantSection plants={plants} totalCount={plants.length} initialMonth={currentMonth} />

        {/* ── 카테고리 태그 (실제 데이터 기반, /plants로 연결) ── */}
        {categories.length > 0 && (
          <section className="pb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c}
                  href="/plants"
                  className="text-xs px-3 py-1.5 rounded-full bg-plant-secondary/15 text-plant-primary font-medium no-underline hover:bg-plant-secondary/25 transition-colors"
                >
                  #{c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 가드닝팁 미리보기 바로 위 광고 — 원래 월별 추천 식물 그리드 중간에 있던
             걸 여기로 옮김(MonthlyPlantSection에서 showAd=false로 끔) ── */}
        <section className="pt-4">
          <AdBanner dataAdSlot="6819394440" />
        </section>

        {/* ── 가드닝팁 미리보기 ── */}
        <section className="py-10 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-plant-primary">가드닝팁</h2>
            <Link href="/guide" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
              전체보기 ({guides.length}) →
            </Link>
          </div>
          {recentGuides.length === 0 ? (
            <p className="text-gray-500 text-sm">등록된 가드닝팁이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentGuides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          )}
        </section>

        {/* ── 마이가든 유도 CTA — 출시 전 "준비 중" 문구를 실제 기능 안내로 교체(2026-08-28) ── */}
        <section className="py-12 text-center">
          <h2 className="text-xl font-bold text-plant-primary mb-2">나만의 식물을 기록해보세요</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            마음에 드는 식물과 가드닝팁을 마이가든에 저장하면,
            <br className="hidden sm:block" />
            개화·파종 시기가 오면 알려드려요.
          </p>
          <Link
            href="/my-garden"
            className="inline-block px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold no-underline hover:opacity-90 transition-opacity"
          >
            마이가든 시작하기
          </Link>
        </section>
      </main>
    </div>
  );
}

function HeroGuideCard({
  guide,
  className,
  titleClassName,
}: {
  guide: GuideSummary;
  className: string;
  titleClassName: string;
}) {
  return (
    <Link
      href={`/guide/${guide.slug}`}
      className={`relative block rounded-lg overflow-hidden no-underline group ${className}`}
    >
      {guide.thumbnail_url ? (
        <Image
          src={guide.thumbnail_url}
          alt={guide.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-plant-secondary/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
        {guide.category && <div className="text-[10px] opacity-80 mb-0.5">{guide.category}</div>}
        <div className={`font-bold leading-snug line-clamp-2 ${titleClassName}`}>{guide.title}</div>
      </div>
    </Link>
  );
}
