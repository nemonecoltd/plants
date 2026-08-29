import type { Metadata } from "next";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import PlantDoctor from "@/components/PlantDoctor";
import { getGuides } from "@/lib/api";

export const metadata: Metadata = {
  title: "AI 식물 진단 — 사진 한 장으로 우리 집 식물 상태 확인",
  description:
    "잎이 노랗게 변했나요? 사진 한 장이면 어떤 식물인지, 지금 상태가 어떤지, 무엇을 해야 하는지 알려드려요. 진단 기록은 마이가든에 저장됩니다.",
  alternates: { canonical: "/diagnose" },
};

// 진단을 기다리는 동안·끝난 뒤 읽을거리가 없으면 페이지가 비어 보인다. 진단에서 자주
// 나오는 증상(과습/병충해/분갈이)을 다룬 글을 미리 붙여 "찍고 끝"이 아니라 읽을거리로
// 이어지게 한다.
const COMMON_SYMPTOM_TAGS = ["과습", "병충해", "분갈이", "물주기", "잎 노랗게"];

export default async function DiagnosePage() {
  const guides = await getGuides();
  const symptomGuides = guides
    .filter((g) => g.tags?.some((t) => COMMON_SYMPTOM_TAGS.includes(t)))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <header className="text-center mb-6">
          <p className="text-[11px] font-bold text-plant-secondary tracking-[0.18em] mb-2">
            AI PLANT COMPANION
          </p>
          <h1 className="text-xl font-bold text-plant-primary mb-2">
            우리 집 식물, 지금 괜찮은 걸까요?
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            사진 한 장이면 어떤 식물인지, 어디가 문제인지,
            <br className="sm:hidden" /> 지금 뭘 해야 하는지 함께 살펴볼게요.
          </p>
        </header>

        <PlantDoctor />

        {symptomGuides.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-plant-primary">
                🌱 이런 증상이라면 이 글도 도움이 돼요
              </h2>
              <Link
                href="/guide"
                className="text-xs text-plant-secondary hover:text-plant-primary no-underline"
              >
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {symptomGuides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <AdBanner dataAdSlot="6819394440" variant="horizontal-slim" />
        </section>
      </main>
    </div>
  );
}
