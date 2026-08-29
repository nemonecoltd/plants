import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import ProductRecommendation, { matchProducts } from "@/components/ProductRecommendation";
import SaveButton from "@/components/SaveButton";
import { getAffiliateProducts, getGuide } from "@/lib/api";
import GuideThumb from "@/components/GuideThumb";

const SITE_URL = "https://plants.nemoneai.com";

interface Props {
  params: Promise<{ slug: string }>;
}

// 농사로 원문 중 일부는 "1. ... 2. ... 3. ..." 단계가 줄바꿈 없이 한 문단에 다 붙어 있어
// 읽기 힘든 경우가 있음 — 태그 경계가 아닌(=이미 줄이 나뉘어 있지 않은) 위치의 단계 번호/
// 항목 기호 앞에만 줄바꿈을 넣어 보완. 이미 <p>로 잘 나뉜 원문은 매칭되지 않아 그대로 유지.
function spaceOutGuideBody(html: string): string {
  return html
    .replace(/([^\s>])\s+(\d{1,2}\.\s)/g, "$1<br /><br />$2")
    .replace(/([^\s>])\s+(※)/g, "$1<br /><br />$2")
    .replace(/([^\s>])\s+(-\s*[가-힣]{1,4}\s*:)/g, "$1<br />$2");
}

// 자체 글은 우리가 길이를 정하므로 본문 중간에 광고 지면을 자연스럽게 넣을 수 있음.
// 첫 소제목(<h2>) 앞을 기준으로 나눠, 도입부를 읽은 직후에 한 번 노출한다.
// 수집분(농사로)은 문단 구조가 제각각이라 적용하지 않는다.
function splitAtFirstHeading(html: string): [string, string] | null {
  const idx = html.indexOf("<h2");
  // 도입부가 너무 짧으면(바로 소제목으로 시작) 광고가 제목 바로 아래 붙어 어색해짐
  if (idx < 200) return null;
  return [html.slice(0, idx), html.slice(idx)];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "가드닝팁" };

  const description = guide.summary || `${guide.title} — 실내정원 가드닝팁`;
  return {
    title: guide.title,
    description,
    alternates: { canonical: `${SITE_URL}/guide/${slug}` },
    openGraph: {
      title: guide.title,
      description,
      url: `${SITE_URL}/guide/${slug}`,
      type: "article",
      locale: "ko_KR",
      siteName: "NEMONE PLANTS",
      images: guide.thumbnail_url ? [guide.thumbnail_url] : undefined,
    },
    twitter: guide.thumbnail_url
      ? { card: "summary_large_image", title: guide.title, description, images: [guide.thumbnail_url] }
      : undefined,
  };
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    notFound();
  }

  const isOriginal = guide.source === "original";
  const affiliateProducts = await getAffiliateProducts();
  const haystack = [guide.title, guide.summary ?? "", guide.category ?? "", ...guide.tags].join(" ");
  const matchedProducts = matchProducts(affiliateProducts, haystack);

  // 수집분은 "만드는 법" 성격이라 HowTo가 맞지만, 자체 글은 설명형 아티클이라 Article이 맞다.
  const jsonLd = isOriginal
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.summary ?? undefined,
        image: guide.thumbnail_url ?? undefined,
        datePublished: guide.published_at ?? undefined,
        dateModified: guide.updated_at ?? guide.published_at ?? undefined,
        mainEntityOfPage: `${SITE_URL}/guide/${slug}`,
        keywords: guide.tags.length ? guide.tags.join(", ") : undefined,
        author: { "@type": "Organization", name: "NEMONE PLANTS", url: SITE_URL },
        publisher: { "@type": "Organization", name: "NEMONE PLANTS", url: SITE_URL },
      }
    : {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: guide.title,
        description: guide.summary ?? undefined,
        image: guide.image_urls ?? undefined,
        datePublished: guide.published_at ?? undefined,
      };

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/guide" className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4">
          ← 가드닝팁 목록
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {guide.thumbnail_url && (
            <div className="relative aspect-[16/9]">
              <GuideThumb src={guide.thumbnail_url} alt={guide.title} priority />
            </div>
          )}
          <div className="p-6">
            {guide.category && <div className="text-xs text-plant-secondary mb-1">{guide.category}</div>}
            <h1 className="text-2xl font-bold text-plant-primary mb-3">{guide.title}</h1>

            <div className="mb-4">
              <SaveButton kind="guide" slug={guide.slug} variant="inline" />
            </div>

            {guide.summary && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4 border-b border-gray-100 pb-4">
                {guide.summary}
              </p>
            )}

            {guide.materials && (
              <div className="bg-plant-secondary/10 rounded p-3 mb-4">
                <div className="text-[11px] font-bold text-plant-primary mb-1">준비물</div>
                <div className="text-[13px] text-gray-700">{guide.materials}</div>
              </div>
            )}

            {guide.body && <GuideBody html={guide.body} isOriginal={isOriginal} />}

            {isOriginal && guide.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-gray-100">
                {guide.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/guide/tag/${encodeURIComponent(t)}`}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-plant-secondary/15 text-plant-primary no-underline hover:bg-plant-secondary/25 transition-colors"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {guide.source === "nongsaro" && (
              <p className="text-[11px] text-gray-400 text-right mt-3">
                {"<출처 : 농사로(농촌진흥청) 제공>"}
              </p>
            )}
          </div>
        </div>

        {/* 증상 글을 읽으러 온 사람에게 가장 자연스러운 다음 행동이 "내 식물도 확인해보기"라
            본문 바로 뒤에 둔다. 진단 페이지로 내부 링크를 흘려보내는 역할도 겸함. */}
        <Link
          href="/diagnose"
          className="mt-6 flex items-center gap-4 bg-plant-primary rounded-2xl px-5 py-4 no-underline group"
        >
          <span className="text-2xl shrink-0" aria-hidden="true">📷</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-white leading-snug">
              우리 집 식물도 이런 상태인가요?
            </span>
            <span className="block text-[11px] text-white/70 mt-0.5">
              사진 한 장으로 지금 상태를 확인해 보세요
            </span>
          </span>
          <span
            className="text-white/80 text-sm shrink-0 group-hover:translate-x-0.5 transition-transform"
            aria-hidden="true"
          >
            →
          </span>
        </Link>

        <div className="mt-6 flex flex-col gap-4">
          {/* 상품 추천은 텍스트 위주라 그 아래가 허전해 보여서, 매칭 여부와 상관없이
              광고는 항상 유지하고 상품 추천은 있을 때만 위에 추가로 보여줌 */}
          {matchedProducts.length > 0 && <ProductRecommendation products={matchedProducts} />}
          <AdBanner dataAdSlot="6819394440" />
        </div>
      </main>
    </div>
  );
}

// 자체 글은 마크다운을 변환한 정돈된 HTML(h2/h3/표/목록)이라 서식을 제대로 살리고,
// 도입부 뒤에 광고를 한 번 넣는다. 수집분은 기존 렌더링(줄바꿈 보정)을 그대로 유지.
function GuideBody({ html, isOriginal }: { html: string; isOriginal: boolean }) {
  const proseClass = isOriginal
    ? "text-[15px] text-gray-700 leading-[1.85] [&_p]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-plant-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-plant-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:text-plant-primary [&_a]:text-plant-primary [&_a]:underline [&_table]:w-full [&_table]:my-5 [&_table]:text-[13px] [&_th]:bg-plant-secondary/10 [&_th]:text-plant-primary [&_th]:font-bold [&_th]:p-2 [&_th]:text-left [&_th]:border [&_th]:border-gray-200 [&_td]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:align-top"
    : "text-sm text-gray-700 leading-relaxed [&_p]:mb-2 [&_img]:rounded [&_img]:my-3 [&_img]:max-w-full";

  if (!isOriginal) {
    return <div className={proseClass} dangerouslySetInnerHTML={{ __html: spaceOutGuideBody(html) }} />;
  }

  const split = splitAtFirstHeading(html);
  if (!split) {
    return <div className={proseClass} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const [intro, rest] = split;
  return (
    <>
      <div className={proseClass} dangerouslySetInnerHTML={{ __html: intro }} />
      <div className="my-6">
        <AdBanner dataAdSlot="6819394440" />
      </div>
      <div className={proseClass} dangerouslySetInnerHTML={{ __html: rest }} />
    </>
  );
}
