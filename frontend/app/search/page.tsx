import type { Metadata } from "next";
import { Suspense } from "react";
import GuideCard from "@/components/GuideCard";
import PlantGrid from "@/components/PlantGrid";
import SearchBar from "@/components/SearchBar";
import { getGuides, getPlants } from "@/lib/api";
import type { GuideSummary, PlantSummary } from "@/lib/api";

// 식물+TIPS 통합 검색(2026-09-11) — 전역 헤더 검색창의 기본 목적지. /plants?q=처럼
// 식물 목록만 필터링하던 것과 달리 getGuides()까지 같은 방식(전체 목록 클라이언트 필터)으로
// 함께 검색해 "결국 키워드 검색이 없다"는 /guide 페이지의 답답함을 해소한다("주제로 찾기"는
// 그대로 유지 — 삭제 대신 검색을 보완하는 방향으로 결정, 2026-09-11).

interface Props {
  searchParams: Promise<{ q?: string }>;
}

function matchesPlant(plant: PlantSummary, needle: string): boolean {
  return [plant.name_kr, plant.name_en, plant.category]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(needle));
}

function matchesGuide(guide: GuideSummary, needle: string): boolean {
  const haystacks = [guide.title, guide.summary, guide.category, ...(guide.tags ?? [])];
  return haystacks.filter((v): v is string => Boolean(v)).some((v) => v.toLowerCase().includes(needle));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `'${q}' 검색결과` : "검색",
    // 쿼리 조합이 무한한 검색결과 페이지 — /plants?q=와 동일하게 색인 제외
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const needle = query.toLowerCase();

  const [allPlants, allGuides] = await Promise.all([getPlants(), getGuides()]);
  const plants = query ? allPlants.filter((p) => matchesPlant(p, needle)) : [];
  const guides = query ? allGuides.filter((g) => matchesGuide(g, needle)) : [];
  const totalCount = plants.length + guides.length;

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-sm mb-6">
          <Suspense fallback={<div className="h-8 rounded-full bg-white border border-gray-200" />}>
            <SearchBar />
          </Suspense>
        </div>

        {!query ? (
          <p className="text-gray-500 text-sm">검색어를 입력해 식물과 TIPS를 함께 찾아보세요.</p>
        ) : totalCount === 0 ? (
          <p className="text-gray-500 text-sm">&apos;{query}&apos;에 대한 검색결과가 없습니다.</p>
        ) : (
          <div className="space-y-10">
            {plants.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-plant-primary mb-4">식물 ({plants.length})</h2>
                <PlantGrid plants={plants} />
              </section>
            )}
            {guides.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-plant-primary mb-4">TIPS ({guides.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {guides.map((g) => (
                    <GuideCard key={g.slug} guide={g} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
