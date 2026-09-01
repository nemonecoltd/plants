import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import ProductRecommendation, { matchProducts } from "@/components/ProductRecommendation";
import { getAffiliateProducts, getMagazinePost } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";
// 원문 소유자는 맛매치(nemoneai.com) — PACE(now_front)와 동일하게 canonical을
// 원문 쪽으로 걸어 중복 콘텐츠로 잡히지 않게 한다. 검색 노출도 원문 쪽에 맡김.
const MATMATCH_POST_URL = (id: number) => `https://nemoneai.com/posts/${id}`;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getMagazinePost(Number(id));
  if (!post) return { title: "매거진" };

  return {
    title: post.title,
    alternates: { canonical: MATMATCH_POST_URL(post.id) },
    robots: { index: false, follow: true },
    openGraph: {
      title: post.title,
      url: MATMATCH_POST_URL(post.id),
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

  const affiliateProducts = await getAffiliateProducts();
  const matchedProducts = matchProducts(affiliateProducts, `${post.title} ${post.tags ?? ""}`);

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/guide" className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4">
          ← TIPS 목록
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {post.image_url && (
            <div className="relative aspect-[16/9]">
              <Image src={post.image_url} alt={post.title} fill className="object-cover" priority />
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
              <a href={MATMATCH_POST_URL(post.id)} target="_blank" rel="noopener noreferrer" className="text-plant-secondary">
                원문: 네모네AIM
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {matchedProducts.length > 0 && <ProductRecommendation products={matchedProducts} />}
          <AdBanner dataAdSlot="6819394440" />
        </div>
      </main>
    </div>
  );
}
