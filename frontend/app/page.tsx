import Image from "next/image";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { getPlants } from "@/lib/api";
import { getPlaceholderImage, HERO_IMAGE } from "@/lib/placeholderImages";

const SUNLIGHT_LABEL: Record<string, string> = {
  full_sun: "양지",
  part_shade: "반음지",
  full_shade: "음지",
};

const SITE_URL = "https://plants.nemoneai.com";
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default async function Home() {
  const plants = await getPlants();
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

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plant-primary/90 via-plant-primary/70 to-plant-primary/40" />

        <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-20 text-white">
          <p className="text-xs tracking-[0.2em] uppercase text-white/70 mb-3">Plant Encyclopedia</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">식물도감 &amp; 케어 가이드</h1>
          <p className="text-white/85 text-sm sm:text-base mb-8">
            계절과 지역에 맞는 식물을 찾고, 정확한 학명·물주기·빛 정보를 확인하세요.
          </p>

          {/* 검색창 — 아직 실제 검색은 붙어있지 않은 디자인 단계 UI */}
          <div className="flex max-w-md rounded-full bg-white overflow-hidden shadow-lg">
            <input
              type="text"
              placeholder="식물 이름으로 검색 (준비 중)"
              disabled
              className="flex-1 px-5 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none disabled:bg-white"
            />
            <span className="flex items-center justify-center w-12 text-plant-primary shrink-0">
              <SearchIcon />
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6">
        {/* ── 월별 퀵필터 + 지역 위젯 안내 ── */}
        <section className="py-8 flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-plant-primary">월별 추천 식물</h2>
              <span className="text-[10px] text-gray-400">(준비 중)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-3 py-1.5 rounded-full border select-none ${
                    m === currentMonth
                      ? "bg-plant-primary text-white border-plant-primary"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {m}월
                </span>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-56 shrink-0 bg-white rounded-lg border border-dashed border-gray-300 p-4">
            <div className="text-[11px] font-bold text-gray-400 mb-1">📍 지역별 환경 정보</div>
            <div className="text-[11px] text-gray-400 leading-relaxed">
              내 위치의 기온·습도에 맞는 식물 추천 기능을 준비하고 있어요.
            </div>
          </div>
        </section>

        {/* ── 카테고리 태그 (실제 데이터 기반, 그리드로 스크롤) ── */}
        {categories.length > 0 && (
          <section className="pb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <a
                  key={c}
                  href="#grid"
                  className="text-xs px-3 py-1.5 rounded-full bg-plant-secondary/15 text-plant-primary font-medium no-underline hover:bg-plant-secondary/25 transition-colors"
                >
                  #{c}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── 식물 그리드 ── */}
        <section id="grid" className="py-4 scroll-mt-20">
          <h2 className="text-lg font-bold text-plant-primary mb-4">전체 식물 ({plants.length})</h2>

          {plants.length === 0 ? (
            <p className="text-gray-500 text-sm">등록된 식물이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {plants.map((p) => {
                const img = getPlaceholderImage(p.slug);
                return (
                  <Link
                    key={p.slug}
                    href={`/plants/${p.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline"
                  >
                    <div className="relative aspect-[4/3] bg-plant-secondary/10">
                      {img ? (
                        <Image src={img} alt={p.name_kr} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]">
                          이미지 준비 중
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-[11px] text-plant-secondary mb-1">{p.category}</div>
                      <div className="font-bold text-plant-primary mb-1">{p.name_kr}</div>
                      {p.name_en && <div className="text-[11px] text-gray-400 italic mb-2">{p.name_en}</div>}
                      <div className="flex flex-wrap gap-1">
                        {p.sunlight && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
                            {SUNLIGHT_LABEL[p.sunlight] ?? p.sunlight}
                          </span>
                        )}
                        {p.difficulty && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
                            난이도 {p.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-10">
            <AdBanner dataAdSlot="6819394440" />
          </div>
        </section>

        {/* ── 가드닝팁 미리보기 (준비 중) ── */}
        <section className="py-10 border-t border-gray-200 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-plant-primary">가드닝팁</h2>
            <span className="text-[10px] text-gray-400">(콘텐츠 준비 중)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-dashed border-gray-300 bg-white p-5 flex flex-col items-center justify-center gap-2 h-32 text-gray-300"
              >
                <LeafIcon />
                <span className="text-[11px]">가드닝 콘텐츠가 곧 채워질 자리예요</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 회원가입 유도 CTA (준비 중) ── */}
        <section className="py-12 text-center">
          <h2 className="text-xl font-bold text-plant-primary mb-2">나만의 식물을 기록해보세요</h2>
          <p className="text-sm text-gray-500 mb-6">마이가든·케어 알림 기능을 준비하고 있어요.</p>
          <span className="inline-block px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold opacity-60 cursor-not-allowed">
            회원가입 (준비 중)
          </span>
        </section>
      </main>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ stroke: "currentColor", strokeWidth: 1.5, fill: "none" }}>
      <path d="M12 21c-4-2-7-6-7-11a8 8 0 0 1 14-5c1 5-2 9-6 11z" />
      <path d="M12 21V9" />
    </svg>
  );
}
