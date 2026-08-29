import type { Metadata } from "next";
import Link from "next/link";
import DiagnosisFeed from "@/components/DiagnosisFeed";
import PageFooterPromo from "@/components/PageFooterPromo";
import Pagination from "@/components/Pagination";
import { getDiagnosisFeedPage } from "@/lib/api";

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  return {
    title: "다른 식물집사들의 AI 진단 모아보기",
    description: "다른 사람들이 올린 식물 사진과 AI 진단 결과를 모아봤어요.",
    alternates: { canonical: "/diagnose/all" },
    // 2페이지부터는 내용이 계속 바뀌고 얕은 페이지가 계속 늘어나는 구조라
    // 색인은 1페이지만(sitemap도 동일) — 링크는 따라가게 둬서 개별 진단으로는 흘러가게 함
    robots: page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function DiagnosisAllPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  // 잘못된 값(0, 음수, 문자)이 와도 조용히 1페이지로 — 페이지네이션 파라미터로
  // 에러 화면을 띄울 이유는 없다
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const { items, total } = await getDiagnosisFeedPage(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/diagnose"
          className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4"
        >
          ← AI 진단
        </Link>

        <h1 className="text-lg font-bold text-plant-primary mb-1">
          다른 식물집사들의 진단 ({total})
        </h1>
        <p className="text-[12px] text-gray-400 mb-6">
          공개 설정된 진단만 모아봤어요. 작성자는 표시하지 않아요.
        </p>

        {items.length === 0 ? (
          <p className="text-gray-500 text-sm py-10">
            {page > 1 ? "더 이상 진단이 없어요." : "아직 공개된 진단이 없어요."}
          </p>
        ) : (
          <DiagnosisFeed items={items} columnsClassName="grid-cols-2 sm:grid-cols-4" />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => (p === 1 ? "/diagnose/all" : `/diagnose/all?page=${p}`)}
        />

        <section className="mt-10">
          <PageFooterPromo />
        </section>
      </main>
    </div>
  );
}
