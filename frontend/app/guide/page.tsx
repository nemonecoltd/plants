import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import { getGuides } from "@/lib/api";

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>;
}

function buildHref(category: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/guide?${qs}` : "/guide";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams;
  return {
    title: category ? `가드닝팁 · ${category}` : "가드닝팁",
    description: "실내정원 DIY 아이디어와 꽃장식·정원 꾸미기, 텃밭 채소·과수 재배법을 모아봤어요.",
    alternates: { canonical: "/guide" },
    // 카테고리 필터 조합은 무한해 색인에서 제외(중복 콘텐츠 방지), 순수 페이지네이션은 색인 허용
    robots: category ? { index: false, follow: true } : undefined,
  };
}

export default async function GuidePage({ searchParams }: Props) {
  const { category, page: pageParam } = await searchParams;
  const allGuides = await getGuides();

  const categoryCounts = new Map<string, number>();
  for (const g of allGuides) {
    if (g.category) categoryCounts.set(g.category, (categoryCounts.get(g.category) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);

  const filtered = category ? allGuides.filter((g) => g.category === category) : allGuides;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 4장 다음에 넣으면 PC(4열)는 2번째 줄, 모바일(2열)은 3번째 줄이 된다(PlantGrid와 동일 근거).
  const nodes: ReactNode[] = [];
  pageItems.forEach((g, i) => {
    nodes.push(<GuideCard key={g.slug} guide={g} />);
    if (i + 1 === 4) {
      nodes.push(
        <div key="ad" className="col-span-full">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      );
    }
  });

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-lg font-bold text-plant-primary mb-4">
          가드닝팁 {category ? `· ${category}` : ""} ({filtered.length})
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/guide"
            className={`text-xs px-3 py-1.5 rounded-full border no-underline ${
              !category
                ? "bg-plant-primary text-white border-plant-primary"
                : "bg-white text-gray-500 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
            }`}
          >
            전체 ({allGuides.length})
          </Link>
          {categories.map(([c, count]) => (
            <Link
              key={c}
              href={`/guide?category=${encodeURIComponent(c)}`}
              className={`text-xs px-3 py-1.5 rounded-full border no-underline ${
                category === c
                  ? "bg-plant-primary text-white border-plant-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
              }`}
            >
              {c} ({count})
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 가드닝팁이 없습니다.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="페이지 이동">
                <Link
                  href={buildHref(category, Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={`text-xs px-3 py-1.5 rounded-full border no-underline ${
                    page === 1
                      ? "bg-gray-100 text-gray-300 border-gray-100 pointer-events-none"
                      : "bg-white text-gray-600 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
                  }`}
                >
                  이전
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildHref(category, p)}
                    className={`text-xs w-7 h-7 flex items-center justify-center rounded-full border no-underline ${
                      p === page
                        ? "bg-plant-primary text-white border-plant-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={buildHref(category, Math.min(totalPages, page + 1))}
                  aria-disabled={page === totalPages}
                  className={`text-xs px-3 py-1.5 rounded-full border no-underline ${
                    page === totalPages
                      ? "bg-gray-100 text-gray-300 border-gray-100 pointer-events-none"
                      : "bg-white text-gray-600 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
                  }`}
                >
                  다음
                </Link>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
