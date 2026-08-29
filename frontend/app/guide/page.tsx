import type { Metadata } from "next";
import GuideListClient from "@/components/GuideListClient";
import { getGuides, getGuideTags } from "@/lib/api";
import { seededShuffle, todaySeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "가드닝팁",
  description: "실내정원 DIY 아이디어와 꽃장식·정원 꾸미기, 텃밭 채소·과수 재배법을 모아봤어요.",
  alternates: { canonical: "/guide" },
};

export default async function GuidePage() {
  const [fetchedGuides, tags] = await Promise.all([getGuides(), getGuideTags()]);
  // 최신 수집분이 published_at 기준으로 몰려서 상단을 독점하지 않도록 섞음
  // (날짜로 시드를 고정해 하루 동안은 안정적, 매일 자연스럽게 순서가 바뀜)
  const guides = seededShuffle(fetchedGuides, todaySeed());

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <GuideListClient guides={guides} tags={tags} />
      </main>
    </div>
  );
}
