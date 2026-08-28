import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import SaveButton from "@/components/SaveButton";
import { getGuide } from "@/lib/api";

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

  const jsonLd = {
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
              <Image src={guide.thumbnail_url} alt={guide.title} fill className="object-cover" priority />
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

            {guide.body && (
              // 농촌진흥청 공식 API가 주는 신뢰된 HTML(사용자 입력 아님) — 단계별 설명 마크업 그대로 렌더링
              <div
                className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2 [&_img]:rounded [&_img]:my-3 [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: spaceOutGuideBody(guide.body) }}
              />
            )}

            {guide.source === "nongsaro" && (
              <p className="text-[11px] text-gray-400 text-right mt-3">
                {"<출처 : 농사로(농촌진흥청) 제공>"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      </main>
    </div>
  );
}
