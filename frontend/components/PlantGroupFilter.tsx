"use client";

import { useRouter, useSearchParams } from "next/navigation";

const GROUPS = ["전체", "꽃", "나무", "과일", "건조", "기타"] as const;

// 모바일에서 5+1개 칩이 한 줄에 다 안 들어갈 수 있어 가로 스크롤로 처리 —
// flex-nowrap + overflow-x-auto, 링크 형태라 페이지 자체는 서버에서 필터링됨.
export default function PlantGroupFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("group") || "전체";
  const q = searchParams.get("q");

  const go = (group: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (group !== "전체") params.set("group", group);
    const qs = params.toString();
    router.push(qs ? `/plants?${qs}` : "/plants");
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => go(g)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            active === g
              ? "bg-plant-primary text-white"
              : "bg-white border border-gray-200 text-gray-500 hover:border-plant-primary hover:text-plant-primary"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
