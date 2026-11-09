import Image from "next/image";
import Link from "next/link";
import DiagnosisImage from "@/components/DiagnosisImage";
import GuideThumb from "@/components/GuideThumb";
import { getLatestDiagnosis, getMagazine, getTopGuides, type DiagnosisStatus } from "@/lib/api";

const STATUS_BADGE: Record<DiagnosisStatus, { label: string; className: string }> = {
  healthy: { label: "건강해요", className: "bg-plant-primary text-white" },
  caution: { label: "살펴볼 점", className: "bg-amber-500 text-white" },
  danger: { label: "조치 필요", className: "bg-red-500 text-white" },
  unknown: { label: "식별 불가", className: "bg-gray-400 text-white" },
};

// 검색으로 상세 글 하나만 읽고 나가던 방문자를 다음 글·진단으로 이어주는 레일(2026-11-09).
// 넓은 화면(xl↑)에서는 본문 오른쪽에 따라다니는 날개로, 좁은 화면에서는 본문 아래 "다음에 볼 것"으로
// 보인다(레일이 화면보다 길어서 top을 음수까지 내려 "아래가 보이게" 붙는다 — 높이가 바뀌면 61rem을 조정). DOM은 한 벌이라 같은 링크가 두 번 나오지 않는다. 호출하는 페이지는 본문을
// <div className="xl:grid xl:grid-cols-[...] xl:gap-8 xl:justify-center"> 안에서 이 컴포넌트와 나란히 둔다.
export default async function SideRail({
  excludeGuideSlug,
  excludeMagazineId,
}: {
  excludeGuideSlug?: string;
  excludeMagazineId?: number;
}) {
  const [top, magazine, diagnosis] = await Promise.all([getTopGuides(7), getMagazine(), getLatestDiagnosis()]);
  const guides = top.filter((g) => g.slug !== excludeGuideSlug).slice(0, 5);
  const posts = magazine.filter((m) => m.id !== excludeMagazineId).slice(0, 3);
  const badge = diagnosis ? (STATUS_BADGE[diagnosis.status] ?? STATUS_BADGE.unknown) : null;

  return (
    <aside
      aria-label="더 보기"
      className="max-w-3xl mx-auto px-6 pb-10 flex flex-col gap-4 xl:mx-0 xl:max-w-none xl:px-0 xl:pb-0 xl:py-8 xl:sticky xl:top-[min(5rem,calc(100vh-61rem))] xl:self-start"
    >
      {guides.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[13px] font-bold text-plant-primary">인기 TIPS</h2>
            <Link href="/guide" className="text-[11px] text-plant-secondary no-underline hover:text-plant-primary">전체 →</Link>
          </div>
          <ol className="flex flex-col">
            {guides.map((g, i) => (
              <li key={g.slug}>
                <Link href={`/guide/${g.slug}`} className="flex gap-2.5 py-2 no-underline group border-t border-gray-100 first:border-t-0">
                  <span className="text-[13px] font-bold text-plant-primary w-4 shrink-0 text-center">{i + 1}</span>
                  <span className="text-[12.5px] leading-snug text-gray-700 group-hover:text-plant-primary line-clamp-2">{g.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {posts.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[13px] font-bold text-plant-primary">최신 매거진</h2>
            <Link href="/guide/magazine" className="text-[11px] text-plant-secondary no-underline hover:text-plant-primary">전체 →</Link>
          </div>
          <ul className="flex flex-col">
            {posts.map((m) => (
              <li key={m.id}>
                <Link href={`/guide/magazine/${m.id}`} className="flex gap-3 py-2 no-underline group border-t border-gray-100 first:border-t-0">
                  <span className="relative w-20 aspect-[4/3] shrink-0 rounded bg-plant-secondary/10 overflow-hidden">
                    {m.image_url && <Image src={m.image_url} alt="" fill sizes="80px" className="object-cover" />}
                  </span>
                  <span className="text-[12.5px] leading-snug text-gray-700 group-hover:text-plant-primary line-clamp-3">{m.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {diagnosis && badge && (
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[13px] font-bold text-plant-primary">최신 진단</h2>
            <Link href="/diagnose/all" className="text-[11px] text-plant-secondary no-underline hover:text-plant-primary">전체 →</Link>
          </div>
          <Link href={`/diagnose/${diagnosis.id}`} className="block no-underline group">
            <div className="relative aspect-[4/3] rounded overflow-hidden bg-plant-secondary/10">
              <DiagnosisImage src={diagnosis.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
            </div>
            <div className="mt-2 text-[12px] font-bold text-plant-primary truncate">{diagnosis.plant_name ?? "이름 미상"}</div>
            {diagnosis.headline && <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 mt-0.5">{diagnosis.headline}</p>}
          </Link>
          <Link href="/diagnose" className="mt-3 block text-center text-[12px] font-bold bg-plant-primary text-white rounded-lg py-2 no-underline">
            📷 우리 집 식물도 진단하기
          </Link>
        </section>
      )}
    </aside>
  );
}
