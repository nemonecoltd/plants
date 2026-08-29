import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import DiagnoseHero from "@/components/DiagnoseHero";
import GuideCard from "@/components/GuideCard";
import LocalEnvWidget from "@/components/LocalEnvWidget";
import MonthlyPlantSection from "@/components/MonthlyPlantSection";
import DiagnosisFeed from "@/components/DiagnosisFeed";
import { getDiagnosisFeed, getGuides, getPlants } from "@/lib/api";
import type { GuideSummary } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

export default async function Home() {
  // PC 3개 / 모바일 2개를 채우되, 비공개 전환 등으로 줄어들 수 있어 조금 여유있게 받는다
  const [plants, guides, feedAll] = await Promise.all([getPlants(), getGuides(), getDiagnosisFeed(6)]);
  const feedItems = feedAll.slice(0, 3);
  // 상단 '오늘의 가드닝팁'을 없애면서 관리자의 "메인 고정"(is_hero)이 갈 곳이 없어져,
  // 하단 가드닝팁 섹션이 고정글을 맨 앞에 올리도록 해 기능을 살려둔다.
  const recentGuides = [...guides]
    .sort((a, b) => Number(b.is_hero) - Number(a.is_hero))
    .slice(0, 3);
  const categories = [...new Set(plants.map((p) => p.category).filter(Boolean))] as string[];
  const currentMonth = new Date().getMonth() + 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: plants.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/plants/${p.slug}`,
      name: p.name_kr,
    })),
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 화면에는 안 보이지만 페이지 정체성을 위해 h1은 유지(SEO/접근성) */}
      <h1 className="sr-only">
        AI 식물 진단 &amp; 식물도감 — 사진으로 상태를 확인하고 마이가든에서 함께 키우기
      </h1>

      {/* 서비스 정체성(사진으로 내 식물을 같이 들여다본다)을 첫 화면에 두기 위해
          기존 '오늘의 가드닝팁'보다 위에 배치 */}
      <DiagnoseHero />

      {/* ── 다른 사람들의 진단 — 진단하기 바로 아래에서 "이 서비스가 실제로 이렇게 쓰인다"를
             보여주는 자리. 원래 여기 있던 '오늘의 가드닝팁'은 같은 페이지 하단 '가드닝팁'
             섹션(3개)과 내용이 겹쳐 제거했다. ── */}
      {feedItems.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-plant-primary">🪴 방금 진단받은 식물들</h2>
            <Link href="/diagnose" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
              더보기 →
            </Link>
          </div>
          {/* 모바일 2개 / PC 3개 */}
          <DiagnosisFeed items={feedItems} columnsClassName="grid-cols-2 sm:grid-cols-3" />
        </section>
      )}

      {/* ── 진단 피드 아래 광고 — PC/모바일 모두 세로로 커지지 않는 슬림한 가로형 ──
           모바일은 화면이 좁아 아래 위젯과의 공백이 크게 도드라져서 pb를 줄임 */}
      <section className="max-w-5xl mx-auto px-6 pb-3 sm:pb-6">
        <AdBanner dataAdSlot="6819394440" variant="horizontal-slim" />
      </section>

      <main className="max-w-5xl mx-auto px-6">
        {/* ── 지역 환경 위젯(IP 기반, 비회원도 노출) — 온도/습도에 맞는 식물 추천 ── */}
        <LocalEnvWidget plants={plants} />

        {/* ── 월별 퀵필터(실제 클릭 가능) + 이번 달 개화 식물 ── */}
        <MonthlyPlantSection plants={plants} totalCount={plants.length} initialMonth={currentMonth} />

        {/* ── 카테고리 태그 (실제 데이터 기반, /plants로 연결) ── */}
        {categories.length > 0 && (
          <section className="pb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c}
                  href="/plants"
                  className="text-xs px-3 py-1.5 rounded-full bg-plant-secondary/15 text-plant-primary font-medium no-underline hover:bg-plant-secondary/25 transition-colors"
                >
                  #{c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 가드닝팁 미리보기 바로 위 광고 — 원래 월별 추천 식물 그리드 중간에 있던
             걸 여기로 옮김(MonthlyPlantSection에서 showAd=false로 끔) ── */}
        <section className="pt-4">
          <AdBanner dataAdSlot="6819394440" />
        </section>

        {/* ── 가드닝팁 미리보기 ── */}
        <section className="py-10 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-plant-primary">가드닝팁</h2>
            <Link href="/guide" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
              전체보기 ({guides.length}) →
            </Link>
          </div>
          {recentGuides.length === 0 ? (
            <p className="text-gray-500 text-sm">등록된 가드닝팁이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentGuides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          )}
        </section>

        {/* ── 마이가든 유도 CTA — 출시 전 "준비 중" 문구를 실제 기능 안내로 교체(2026-08-28) ── */}
        <section className="py-12 text-center">
          <h2 className="text-xl font-bold text-plant-primary mb-2">나만의 식물을 기록해보세요</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            마음에 드는 식물과 가드닝팁을 마이가든에 저장하면,
            <br className="hidden sm:block" />
            개화·파종 시기가 오면 알려드려요.
          </p>
          <Link
            href="/my-garden"
            className="inline-block px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold no-underline hover:opacity-90 transition-opacity"
          >
            마이가든 시작하기
          </Link>
        </section>
      </main>
    </div>
  );
}
