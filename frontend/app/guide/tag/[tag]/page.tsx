import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import { getGuides, getGuideTags } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

interface Props {
  params: Promise<{ tag: string }>;
}

// 태그 페이지는 롱테일 키워드 하나당 색인 대상 페이지를 하나씩 만들어주는 역할.
// 관련 글끼리 내부 링크로 묶이는 효과도 있어 자체 글이 쌓일수록 가치가 커진다.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `${decoded} 관련 가드닝팁`,
    description: `${decoded}에 대한 가드닝팁을 모았습니다. 화분 관리와 식물 키우기에 바로 쓰는 정보.`,
    alternates: { canonical: `${SITE_URL}/guide/tag/${encodeURIComponent(decoded)}` },
  };
}

export default async function GuideTagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  const [guides, tags] = await Promise.all([getGuides(), getGuideTags()]);
  const matched = guides.filter((g) => g.tags?.includes(decoded));

  // 존재하지 않는 태그로 들어오면 빈 페이지를 색인시키지 않고 404
  if (matched.length === 0) {
    notFound();
  }

  const otherTags = tags.filter((t) => t.tag !== decoded).slice(0, 12);

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/guide"
          className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4"
        >
          ← 가드닝팁 목록
        </Link>

        <h1 className="text-lg font-bold text-plant-primary mb-1">#{decoded}</h1>
        <p className="text-sm text-gray-500 mb-6">{matched.length}개의 가드닝팁</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {matched.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>

        <div className="mt-8">
          <AdBanner dataAdSlot="6819394440" />
        </div>

        {otherTags.length > 0 && (
          <section className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-[11px] font-bold text-gray-400 tracking-wider mb-4">다른 주제도 살펴보세요</h2>
            <div className="flex flex-wrap gap-2">
              {otherTags.map((t) => (
                <Link
                  key={t.tag}
                  href={`/guide/tag/${encodeURIComponent(t.tag)}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white text-gray-500 border border-gray-200 no-underline hover:border-plant-primary hover:text-plant-primary transition-colors"
                >
                  #{t.tag} <span className="text-gray-300">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
