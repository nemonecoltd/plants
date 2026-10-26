import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import ProductRecommendation, { matchProducts } from "@/components/ProductRecommendation";
import { getAffiliateProducts, getMagazine, getMagazinePost } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";
// 2026-10-24: 색인·정본을 PLANTS 쪽으로 옮김 — PLANTS 소속 기사(맛매치 Special #6)는 여기가 주인이고,
// 맛매치 /posts/N이 정본을 이 URL로 가리킨다(트래픽을 서비스로 보내기 위해).
const MAGAZINE_URL = (id: number) => `${SITE_URL}/guide/magazine/${id}`;
// 원문(맛매치) 주소 — PLANTS 소속이 아닌 기사(맛매치 Special #6 밖)는 종전처럼 맛매치가 정본.
const MATMATCH_POST_URL = (id: number) => `https://nemoneai.com/posts/${id}`;

// 2026-10-24부터 **새로 발행하는** PLANTS 소속 기사(맛매치 Special #6)만 이 페이지가 정본.
// 그 전 글과 그 밖의 맛매치 기사는 종전처럼 맛매치가 정본·noindex(과거 글 색인 이동 리스크 회피).
// 조회 실패 시에도 맛매치 정본으로 폴백(중복 색인 방지). 맛매치(serviceHome.ts)·PACE와 같은 기준일 — 바꿀 땐 세 곳을 함께.
const OWNED_SINCE = process.env.SERVICE_OWNED_SINCE || "2026-10-24";

async function isOwned(id: number): Promise<boolean> {
  const list = await getMagazine();
  return list.some((m) => m.id === id && (m.created_at ?? "").slice(0, 10) >= OWNED_SINCE);
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getMagazinePost(Number(id));
  if (!post) return { title: "매거진" };
  const owned = await isOwned(post.id);
  const canonical = owned ? MAGAZINE_URL(post.id) : MATMATCH_POST_URL(post.id);

  return {
    title: post.title,
    description: post.body_text ? post.body_text.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 150) : undefined,
    alternates: { canonical },
    ...(owned ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: post.title,
      url: canonical,
      type: "article",
      locale: "ko_KR",
      siteName: "NEMONE PLANTS",
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

export default async function MagazinePostPage({ params }: Props) {
  const { id } = await params;
  const post = await getMagazinePost(Number(id));
  if (!post) notFound();

  const owned = await isOwned(post.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: post.created_at ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": MAGAZINE_URL(post.id) },
    author: { "@type": "Organization", name: "NEMONE" },
    publisher: { "@type": "Organization", name: "NEMONE PLANTS" },
  };
  const affiliateProducts = await getAffiliateProducts();
  // 매거진은 모든 글 하단에 쿠팡 관련 용품이 같은 모양으로 나오도록, 매칭이 없으면 상위 상품을 보여 준다.
  const matched = matchProducts(affiliateProducts, `${post.title} ${post.tags ?? ""}`);
  const matchedProducts = matched.length > 0 ? matched : affiliateProducts.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      {owned && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/guide/magazine" className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4">
          ← 매거진 목록
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {post.image_url && (
            // 매거진 썸네일 원본 비율이 글마다 제각각(2:1 배너부터 세로형 포스터까지)이라
            // object-cover 고정 크롭이면 콘텐츠가 한쪽에 몰린 이미지는 그쪽이 크게 잘려나감
            // (2026-09-18 실사고 — 좌측 정렬 템플릿 이미지의 로고·제목이 잘려 보임).
            // object-contain + 여백 배경으로 전환해 어떤 비율이 와도 항상 전체가 보이게 함.
            <div className="relative aspect-[16/9] bg-gray-50">
              <Image src={post.image_url} alt={post.title} fill className="object-contain" priority />
            </div>
          )}
          <div className="p-6">
            <div className="text-[11px] text-plant-secondary mb-1">매거진</div>
            <h1 className="text-xl font-bold text-plant-primary mb-4">{post.title}</h1>
            <div
              className="text-[15px] text-gray-700 leading-[1.85] [&_p]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-plant-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:text-plant-primary [&_a]:text-plant-primary [&_a]:underline [&_hr]:my-6 [&_hr]:border-gray-100"
              dangerouslySetInnerHTML={{ __html: post.body_text ?? "" }}
            />
            <p className="text-[11px] text-gray-400 text-right mt-6 pt-4 border-t border-gray-100">
              <a href="https://nemoneai.com" target="_blank" rel="noopener noreferrer" className="text-plant-secondary">
                네모네AIM에서 더 많은 이야기
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {matchedProducts.length > 0 && <ProductRecommendation products={matchedProducts} />}
          <AdBanner dataAdSlot="6819394440" variant="horizontal-slim" />
        </div>
      </main>
    </div>
  );
}
