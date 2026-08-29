import Link from "next/link";

// /diagnose/all에서 쓰던 이전/다음 페이지네이션을 다른 목록 페이지에서도 재사용하기
// 위해 뽑아낸 공용 컴포넌트. buildHref는 검색어(q) 같은 다른 쿼리를 유지한 채
// page만 바꾼 URL을 페이지마다 다르게 만들어야 해서 함수로 받는다.
export default function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-3 mt-8" aria-label="페이지 이동">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
        >
          ← 이전
        </Link>
      ) : (
        <span className="text-xs px-4 py-2 text-gray-300">← 이전</span>
      )}
      <span className="text-xs text-gray-400 tabular-nums">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
        >
          다음 →
        </Link>
      ) : (
        <span className="text-xs px-4 py-2 text-gray-300">다음 →</span>
      )}
    </nav>
  );
}
