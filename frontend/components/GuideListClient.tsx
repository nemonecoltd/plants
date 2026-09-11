"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import MagazineList from "@/components/MagazineList";
import type { GuideSummary, GuideTag } from "@/lib/api";

const PAGE_SIZE = 24;

const GUIDE_GROUPS = ["전체", "가드닝 기초", "실내가드닝", "텃밭·채소", "플로럴 소품", "매거진"] as const;
type GuideGroup = (typeof GUIDE_GROUPS)[number];

// 기존 category(농사로 수집 당시 카테고리 그대로라 14개로 흩어져 있음)를 사용자가
// 보기 편한 5개 상위 분류로 묶는다 — DB 마이그레이션 없이 프론트에서만 매핑
// (guides.category는 이미 여러 화면에서 원본 그대로 노출 중이라 값 자체는 안 건드림).
const CATEGORY_TO_GROUP: Record<string, GuideGroup> = {
  "가드닝 기초": "가드닝 기초",
  "식물을 이용한 생활속의 지혜": "가드닝 기초",
  "나만의 작은 정원 꾸미기": "실내가드닝",
  "디쉬가든": "실내가드닝",
  "공중걸이": "실내가드닝",
  "벽걸이": "실내가드닝",
  "표준화분": "실내가드닝",
  "채소": "텃밭·채소",
  "과수": "텃밭·채소",
  "무공해 채소 기르기": "텃밭·채소",
  "인삼약초버섯": "텃밭·채소",
  "말린꽃과 자연물로 소품 만들기": "플로럴 소품",
  "생화가 돋보이는 손쉬운 꾸미기": "플로럴 소품",
  "색상별 선호 꽃": "플로럴 소품",
  "꽃이 화려하고 향이 은은한 화초기르기": "플로럴 소품",
};

function groupOf(guide: GuideSummary): GuideGroup {
  return CATEGORY_TO_GROUP[guide.category ?? ""] ?? "가드닝 기초";
}

// 글이 쌓일수록 태그가 100개 넘게 늘어나 "주제로 찾기"가 수십 줄을 차지하던 문제 —
// 자주 쓰인 태그(이미 count DESC로 정렬돼 옴) 위주로 모바일 기준 1줄만 기본 노출하고
// 나머지는 접어둔다(3개 + "더보기" 버튼이 모바일 폭 한 줄에 들어가는 상한).
const VISIBLE_TAG_COUNT = 3;

export default function GuideListClient({ guides, tags }: { guides: GuideSummary[]; tags: GuideTag[] }) {
  const [group, setGroup] = useState<GuideGroup>("전체");
  const [showAllTags, setShowAllTags] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    return group === "전체" ? guides : guides.filter((g) => groupOf(g) === group);
  }, [guides, group]);
  const visibleTags = showAllTags ? tags : tags.slice(0, VISIBLE_TAG_COUNT);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 분류가 바뀌면 페이지네이션도 1페이지로 되돌려야 "분류 바꿨더니 빈 3페이지가
  // 보이는" 상황을 피할 수 있다
  useEffect(() => {
    setPage(1);
  }, [group]);

  const nodes = visible.flatMap((g, i) => {
    const card = <GuideCard key={g.slug} guide={g} />;
    if (i + 1 !== 4) return [card];
    return [
      card,
      <div key="ad" className="col-span-full">
        <AdBanner dataAdSlot="6819394440" />
      </div>,
    ];
  });

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GUIDE_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              group === g
                ? "bg-plant-primary text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-plant-primary hover:text-plant-primary"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {group === "매거진" ? (
        <MagazineList />
      ) : (
        <>
      {tags.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="text-[11px] font-bold text-gray-400 tracking-wider mb-2.5">주제로 찾기</div>
          <div
            className={
              showAllTags
                ? "flex flex-wrap gap-2"
                : "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            }
          >
            {visibleTags.map((t) => (
              <Link
                key={t.tag}
                href={`/guide/tag/${encodeURIComponent(t.tag)}`}
                className="shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-plant-secondary/15 text-plant-primary font-medium no-underline hover:bg-plant-secondary/25 transition-colors"
              >
                #{t.tag} <span className="opacity-50">{t.count}</span>
              </Link>
            ))}
            {tags.length > VISIBLE_TAG_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllTags((v) => !v)}
                className="shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-plant-primary hover:text-plant-primary transition-colors"
              >
                {showAllTags ? "접기" : `+${tags.length - VISIBLE_TAG_COUNT}개 더`}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">해당하는 TIPS가 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>
          {/* URL 쿼리가 아니라 이 컴포넌트의 상태로만 페이지를 넘긴다(검색이 클라이언트
              실시간 필터라 서버 왕복이 없어서) — 공용 Pagination(Link 기반)과는
              별개로 버튼 기반을 여기서 직접 둔다 */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 mt-8" aria-label="페이지 이동">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-plant-primary hover:text-plant-primary disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
              >
                ← 이전
              </button>
              <span className="text-xs text-gray-400 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-plant-primary hover:text-plant-primary disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
              >
                다음 →
              </button>
            </nav>
          )}
        </>
      )}
        </>
      )}
    </>
  );
}
