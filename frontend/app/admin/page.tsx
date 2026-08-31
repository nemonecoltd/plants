import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { adminListGuides } from "@/lib/adminApi";
import DeleteGuideButton from "./DeleteGuideButton";
import GuideThumb from "@/components/GuideThumb";

export default async function AdminGuideListPage() {
  // layout이 화면 출력은 막아주지만, 페이지 컴포넌트 자체는 그와 무관하게 실행되므로
  // (children이 버려지기 전에도 데이터 패칭은 일어남) 여기서도 한 번 더 확인해
  // 불필요한 백엔드 호출/에러 로그를 막는다.
  const admin = await requireAdmin();
  if (!admin) return null;

  const guides = await adminListGuides();

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-plant-primary">콘텐츠 관리 ({guides.length})</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/plants"
            className="inline-block px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium no-underline hover:border-plant-primary hover:text-plant-primary transition-colors"
          >
            🌿 식물도감 관리
          </Link>
          <Link
            href="/admin/products"
            className="inline-block px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium no-underline hover:border-plant-primary hover:text-plant-primary transition-colors"
          >
            🛒 상품 관리
          </Link>
          <Link
            href="/admin/new"
            className="inline-block px-4 py-2 rounded-full bg-plant-primary text-white text-sm font-bold no-underline hover:opacity-90 transition-opacity"
          >
            + 생성
          </Link>
        </div>
      </div>

      {guides.length === 0 ? (
        <p className="text-sm text-gray-500">아직 생성한 콘텐츠가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {guides.map((g) => (
            <div
              key={g.slug}
              className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden bg-plant-secondary/10">
                {g.thumbnail_url && (
                  <GuideThumb src={g.thumbnail_url} alt={g.title} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {g.is_hero && <span title="메인 고정">⭐</span>}
                  <div className="font-bold text-sm text-plant-primary truncate">{g.title}</div>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {g.category} · {g.tags.join(", ")} · {g.published_at?.slice(0, 10)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/${g.slug}/edit`}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
                >
                  편집
                </Link>
                <DeleteGuideButton slug={g.slug} title={g.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
