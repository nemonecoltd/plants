import type { Metadata } from "next";
import Link from "next/link";
import GuideCard from "@/components/GuideCard";
import PlantDoctor from "@/components/PlantDoctor";
import DiagnosisFeed from "@/components/DiagnosisFeed";
import PageFooterPromo from "@/components/PageFooterPromo";
import { getDiagnosisFeed, getGuides } from "@/lib/api";
import { SYMPTOMS } from "./symptoms";

const SITE_URL = "https://plants.nemoneai.com";
const TITLE = "AI 식물 진단 — 사진 한 장으로 우리 집 식물 상태 확인";
const DESCRIPTION =
  "잎이 노랗게 변했나요? 사진 한 장이면 어떤 식물인지, 지금 상태가 어떤지, 무엇을 해야 하는지 알려드려요. 진단 기록은 마이가든에 저장됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/diagnose" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "NEMONE PLANTS",
    url: `${SITE_URL}/diagnose`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/images/plants/hero.jpg", width: 960, height: 640, alt: "NEMONE PLANTS AI 식물 진단" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/plants/hero.jpg"],
  },
};

// 진단을 기다리는 동안·끝난 뒤 읽을거리가 없으면 페이지가 비어 보인다. 진단에서 자주
// 나오는 증상(과습/병충해/분갈이)을 다룬 글을 미리 붙여 "찍고 끝"이 아니라 읽을거리로
// 이어지게 한다.
const COMMON_SYMPTOM_TAGS = ["과습", "병충해", "분갈이", "물주기", "잎 노랗게"];

export default async function DiagnosePage() {
  const [guides, feedItems] = await Promise.all([getGuides(), getDiagnosisFeed(12)]);
  const symptomGuides = guides
    .filter((g) => g.tags?.some((t) => COMMON_SYMPTOM_TAGS.includes(t)))
    .slice(0, 4);

  // 진단 자체는 로그인 후 클라이언트에서 동작해 크롤러에게는 빈 페이지에 가깝다.
  // 증상 FAQ가 이 페이지의 실제 색인 대상 본문이 되고, 동시에 FAQ 리치결과를 노린다.
  // WebApplication(앱 자체 정의)은 layout.tsx에 한 번만 둔다 — 페이지마다 또 선언하면
  // 같은 엔티티가 둘로 갈려 신호가 흐려진다. 여기서는 이 페이지 고유의 FAQ만 낸다.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SYMPTOMS.map((s) => ({
      "@type": "Question",
      name: s.question,
      acceptedAnswer: { "@type": "Answer", text: s.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

        {/* 진단이 쌓이는 곳 — 내 기록은 마이가든에, 공개된 진단은 모두 여기 모인다 */}
        {feedItems.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-bold text-plant-primary mb-1">
              다른 식물집사들의 진단
            </h2>
            <p className="text-[12px] text-gray-400 mb-4">
              공개된 진단만 보여드려요. 내 진단은 마이가든에서 언제든 내릴 수 있어요.
            </p>
            <DiagnosisFeed items={feedItems} columnsClassName="grid-cols-2 sm:grid-cols-4" />
          </section>
        )}

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


        {/* 자주 묻는 증상 — 진단을 못(안) 돌려본 방문자도 답을 얻어가는 자리 */}
        <section className="mt-10">
          <h2 className="text-base font-bold text-plant-primary mb-4">
            자주 묻는 식물 증상
          </h2>
          <div className="space-y-3">
            {SYMPTOMS.map((s) => (
              <article
                key={s.question}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <h3 className="text-[14px] font-bold text-gray-800 mb-2">{s.question}</h3>
                <p className="text-[13px] text-gray-600 leading-[1.85]">{s.answer}</p>
                <Link
                  href={`/guide/tag/${encodeURIComponent(s.tag)}`}
                  className="inline-block text-[11px] mt-3 px-2.5 py-1 rounded-full bg-plant-secondary/15 text-plant-primary no-underline hover:bg-plant-secondary/25 transition-colors"
                >
                  #{s.tag} 글 더보기
                </Link>
              </article>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            증상이 겹쳐 보일 때는 사진으로 진단해 보세요. 잎 색과 흙 상태를 함께 보고
            더 구체적으로 알려드려요.
          </p>
        </section>

        {/* 증상 FAQ에서 다루는 과습·병충해·분갈이 문맥으로 용품을 매칭 */}
        <section className="mt-8">
          <PageFooterPromo haystack={SYMPTOMS.map((s) => `${s.question} ${s.tag}`).join(" ")} />
        </section>
      </main>
    </div>
  );
}
