import type { Metadata } from "next";
import { Suspense } from "react";
import Pagination from "@/components/Pagination";
import PlantGrid from "@/components/PlantGrid";
import SearchBar from "@/components/SearchBar";
import { getPlants } from "@/lib/api";
import type { PlantSummary } from "@/lib/api";

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

function matchesQuery(plant: PlantSummary, q: string): boolean {
  const needle = q.toLowerCase();
  return [plant.name_kr, plant.name_en, plant.category]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(needle));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  return {
    title: q ? `'${q}' 검색결과` : "전체 식물도감",
    description: "실내정원용 식물을 포함해 등록된 모든 식물을 한눈에 찾아보세요.",
    alternates: { canonical: "/plants" },
    // 검색 결과나 2페이지 이상은 쿼리 조합이 무한하거나 내용이 얕게 반복돼
    // 색인 대상에서 제외(중복 콘텐츠 방지). 링크는 따라가게 둬 상세페이지로는 흘러가게 함
    robots: q || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function PlantsPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const allPlants = await getPlants();
  const filtered = q ? allPlants.filter((p) => matchesQuery(p, q)) : allPlants;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const plants = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/plants?${qs}` : "/plants";
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="max-w-sm mb-5">
          <Suspense fallback={<div className="h-8 rounded-full bg-white border border-gray-200" />}>
            <SearchBar />
          </Suspense>
        </div>

        <h1 className="text-lg font-bold text-plant-primary mb-4">
          {q ? `'${q}' 검색결과 (${filtered.length})` : `전체 식물도감 (${filtered.length})`}
        </h1>

        {q && filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">
            &apos;{q}&apos;에 대한 검색결과가 없습니다. 다른 이름으로 검색해보세요.
          </p>
        ) : (
          <>
            <PlantGrid plants={plants} />
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </main>
    </div>
  );
}
