import type { Metadata } from "next";
import Link from "next/link";
import MagazineCard from "@/components/MagazineCard";
import { getMagazine } from "@/lib/api";

// 2026-10-24: PLANTS 소속 기사(맛매치 Special #6)의 색인·정본이 PLANTS로 이동 — 크롤러가 개별 기사를 발견하도록
// 서버에서 목록을 그려 둔 허브 페이지(가드닝팁 목록·사이트맵에서 링크).
export const metadata: Metadata = {
  title: "식물 매거진",
  description: "초보 식집사를 위한 반려식물 이야기. 식물 고르기부터 키우기까지 NEMONE PLANTS 매거진.",
  alternates: { canonical: "/guide/magazine" },
};

export default async function MagazineIndexPage() {
  const posts = await getMagazine();
  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/guide" className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4">
          ← 가드닝팁
        </Link>
        <h1 className="text-lg font-bold text-plant-primary mb-4">식물 매거진</h1>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">아직 매거진 글이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {posts.map((p) => (
              <MagazineCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
