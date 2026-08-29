import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosisFeed from "@/components/DiagnosisFeed";
import GuideCard from "@/components/GuideCard";
import PageFooterPromo from "@/components/PageFooterPromo";
import { getDiagnosis, getDiagnosisFeed, getGuides } from "@/lib/api";
import type { DiagnosisStatus } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS: Record<DiagnosisStatus, { label: string; badge: string; ring: string }> = {
  healthy: { label: "건강해요", badge: "bg-plant-primary text-white", ring: "border-plant-primary/30" },
  caution: { label: "살펴볼 점이 있어요", badge: "bg-amber-500 text-white", ring: "border-amber-300" },
  danger: { label: "빠른 조치가 필요해요", badge: "bg-red-500 text-white", ring: "border-red-300" },
  unknown: { label: "알아보기 어려워요", badge: "bg-gray-400 text-white", ring: "border-gray-200" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const diagnosis = await getDiagnosis(Number(id));
  if (!diagnosis) return { title: "진단 결과" };

  const name = diagnosis.plant_name ?? "식물";
  return {
    title: `${name} 진단 결과`,
    description: diagnosis.headline ?? `${name}의 상태를 AI가 살펴본 결과입니다.`,
    // 개별 진단은 사용자 사진 + AI 소견이라 비슷한 글이 계속 늘어난다. 색인시키면
    // 얇은 문서가 사이트 전체 평가를 끌어내릴 수 있어 noindex로 두고, 대신 링크는
    // 따라가게(follow) 해서 도감·가드닝팁으로 신호가 흐르도록 한다.
    // 색인 대상은 /diagnose 허브 페이지 하나로 유지.
    robots: { index: false, follow: true },
  };
}

export default async function DiagnosisDetailPage({ params }: Props) {
  const { id } = await params;
  const diagnosis = await getDiagnosis(Number(id));
  if (!diagnosis) notFound();

  const [guides, feedItems] = await Promise.all([getGuides(), getDiagnosisFeed(8)]);
  const style = STATUS[diagnosis.status] ?? STATUS.unknown;

  // 진단에서 나온 태그로 관련 가드닝팁을 붙여 "읽고 끝"이 아니라 해결로 이어지게 한다
  const relatedGuides = guides
    .filter((g) => g.tags?.some((t) => diagnosis.tags.includes(t)))
    .slice(0, 4);
  const others = feedItems.filter((f) => f.id !== diagnosis.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/diagnose"
          className="inline-block text-plant-secondary text-xs no-underline hover:text-plant-primary mb-4"
        >
          ← AI 진단
        </Link>

        <article className={`bg-white rounded-2xl border-2 ${style.ring} overflow-hidden`}>
          {/* 사용자 사진은 백엔드가 /api/로 서빙해 next/image를 태우지 못한다(GuideThumb 설명 참고) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={diagnosis.image_url} alt="" className="w-full max-h-80 object-cover" />

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                {style.label}
              </span>
              {diagnosis.plant_name && (
                <h1 className="text-[15px] font-bold text-plant-primary">{diagnosis.plant_name}</h1>
              )}
              {diagnosis.created_at && (
                <span className="text-[11px] text-gray-400 ml-auto">
                  {new Date(diagnosis.created_at).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>

            {diagnosis.headline && (
              <p className="text-[15px] font-bold text-gray-800 leading-snug mb-4">
                {diagnosis.headline}
              </p>
            )}

            {diagnosis.body_html && (
              <div
                className="text-[14px] text-gray-700 leading-[1.8] [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-plant-primary [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1"
                dangerouslySetInnerHTML={{ __html: diagnosis.body_html }}
              />
            )}

            {diagnosis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {diagnosis.tags.map((t) => (
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

            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
              {diagnosis.matched_plant_slug && (
                <Link
                  href={`/plants/${diagnosis.matched_plant_slug}`}
                  className="text-xs font-bold px-4 py-2 rounded-full bg-plant-primary text-white no-underline hover:opacity-90"
                >
                  도감에서 자세히 보기 →
                </Link>
              )}
              <Link
                href="/diagnose"
                className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
              >
                내 식물도 진단하기
              </Link>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
              AI 진단은 사진만으로 판단한 참고 의견이에요.
            </p>
          </div>
        </article>

        {relatedGuides.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold text-plant-primary mb-3">
              🌱 이 증상에 도움이 되는 글
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedGuides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold text-plant-primary mb-3">다른 진단도 보기</h2>
            <DiagnosisFeed items={others} columnsClassName="grid-cols-2 sm:grid-cols-4" />
          </section>
        )}

        <section className="mt-8">
          <PageFooterPromo haystack={[diagnosis.plant_name ?? "", ...diagnosis.tags].join(" ")} />
        </section>
      </main>
    </div>
  );
}
