import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AdBanner from "@/components/AdBanner";
import { getGuides } from "@/lib/api";
import type { GuideSummary } from "@/lib/api";

export const metadata: Metadata = {
  title: "가드닝팁",
  description: "실내정원 DIY 아이디어와 꽃장식·정원 꾸미기 팁을 모아봤어요.",
  alternates: { canonical: "/guide" },
};

function GuideCard({ guide }: { guide: GuideSummary }) {
  return (
    <Link
      href={`/guide/${guide.slug}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline"
    >
      <div className="relative aspect-[4/3] bg-plant-secondary/10">
        {guide.thumbnail_url ? (
          <Image src={guide.thumbnail_url} alt={guide.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]">
            이미지 준비 중
          </div>
        )}
      </div>
      <div className="p-4">
        {guide.category && <div className="text-[11px] text-plant-secondary mb-1">{guide.category}</div>}
        <div className="font-bold text-plant-primary text-sm leading-snug line-clamp-2">{guide.title}</div>
      </div>
    </Link>
  );
}

export default async function GuidePage() {
  const guides = await getGuides();

  // 4장 다음에 넣으면 PC(4열)는 2번째 줄, 모바일(2열)은 3번째 줄이 된다(PlantGrid와 동일 근거).
  const nodes: ReactNode[] = [];
  guides.forEach((g, i) => {
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
        <h1 className="text-lg font-bold text-plant-primary mb-4">가드닝팁 ({guides.length})</h1>

        {guides.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 가드닝팁이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>
        )}
      </main>
    </div>
  );
}
