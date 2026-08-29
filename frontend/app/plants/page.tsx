import type { Metadata } from "next";
import { Suspense } from "react";
import PlantGrid from "@/components/PlantGrid";
import SearchBar from "@/components/SearchBar";
import { getPlants } from "@/lib/api";
import type { PlantSummary } from "@/lib/api";
import PageFooterPromo from "@/components/PageFooterPromo";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

function matchesQuery(plant: PlantSummary, q: string): boolean {
  const needle = q.toLowerCase();
  return [plant.name_kr, plant.name_en, plant.category]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(needle));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `'${q}' 검색결과` : "전체 식물도감",
    description: "실내정원용 식물을 포함해 등록된 모든 식물을 한눈에 찾아보세요.",
    alternates: { canonical: "/plants" },
    // 검색 결과 페이지는 쿼리 조합이 무한해 색인 대상에서 제외(중복 콘텐츠 방지)
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function PlantsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const allPlants = await getPlants();
  const plants = q ? allPlants.filter((p) => matchesQuery(p, q)) : allPlants;

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-sm mb-5">
          <Suspense fallback={<div className="h-8 rounded-full bg-white border border-gray-200" />}>
            <SearchBar />
          </Suspense>
        </div>

        <h1 className="text-lg font-bold text-plant-primary mb-4">
          {q ? `'${q}' 검색결과 (${plants.length})` : `전체 식물도감 (${plants.length})`}
        </h1>

        {q && plants.length === 0 ? (
          <p className="text-gray-500 text-sm">
            &apos;{q}&apos;에 대한 검색결과가 없습니다. 다른 이름으로 검색해보세요.
          </p>
        ) : (
          <PlantGrid plants={plants} />
        )}

        <div className="mt-10">
          <PageFooterPromo haystack={q ?? ""} />
        </div>
      </main>
    </div>
  );
}
