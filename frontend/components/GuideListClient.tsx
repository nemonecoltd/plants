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

function matches(guide: GuideSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [guide.title, guide.summary ?? "", guide.category ?? "", ...guide.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

// 글이 쌓일수록 태그가 100개 넘게 늘어나 "주제로 찾기"가 수십 줄을 차지하던 문제 —
// 자주 쓰인 태그(이미 count DESC로 정렬돼 옴) 위주로 모바일 기준 1줄만 기본 노출하고
// 나머지는 접어둔다(14개는 모바일 좁은 폭에서 4줄까지 차지해서 4개로 축소).
const VISIBLE_TAG_COUNT = 4;

export default function GuideListClient({ guides, tags }: { guides: GuideSummary[]; tags: GuideTag[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GuideGroup>("전체");
  const [showAllTags, setShowAllTags] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const byQuery = guides.filter((g) => matches(g, query));
    return group === "전체" ? byQuery : byQuery.filter((g) => groupOf(g) === group);
  }, [guides, query, group]);
  const visibleTags = showAllTags ? tags : tags.slice(0, VISIBLE_TAG_COUNT);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 이 페이지는 전체 목록을 클라이언트에서 실시간으로 검색하는 구조라(=서버 왕복 없음)
  // 검색어나 분류가 바뀌면 페이지네이션도 1페이지로 되돌려야 "검색했더니 빈 3페이지가
  // 보이는" 상황을 피할 수 있다
  useEffect(() => {
    setPage(1);
  }, [query, group]);

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-plant-primary">
          TIPS {group !== "매거진" && <span className="text-gray-400 font-normal">({filtered.length})</span>}
        </h1>
      </div>

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
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 가드닝 팁을 검색해보세요 (예: 물주기, 장마철)"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border border-gray-200 bg-white outline-none focus:border-plant-primary transition-colors placeholder:text-gray-300"
        />
      </div>

      {tags.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="text-[11px] font-bold text-gray-400 tracking-wider mb-2.5">주제로 찾기</div>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((t) => (
              <Link
                key={t.tag}
                href={`/guide/tag/${encodeURIComponent(t.tag)}`}
                className="text-xs px-3 py-1.5 rounded-full bg-plant-secondary/15 text-plant-primary font-medium no-underline hover:bg-plant-secondary/25 transition-colors"
              >
                #{t.tag} <span className="opacity-50">{t.count}</span>
              </Link>
            ))}
            {tags.length > VISIBLE_TAG_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllTags((v) => !v)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-plant-primary hover:text-plant-primary transition-colors"
              >
                {showAllTags ? "접기" : `+${tags.length - VISIBLE_TAG_COUNT}개 더`}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">&quot;{query}&quot;에 해당하는 TIPS가 없습니다.</p>
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
