"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import GuideCard from "@/components/GuideCard";
import type { GuideSummary, GuideTag } from "@/lib/api";

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
  const [showAllTags, setShowAllTags] = useState(false);
  const filtered = useMemo(() => guides.filter((g) => matches(g, query)), [guides, query]);
  const visibleTags = showAllTags ? tags : tags.slice(0, VISIBLE_TAG_COUNT);

  const nodes = filtered.flatMap((g, i) => {
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
          가드닝팁 <span className="text-gray-400 font-normal">({filtered.length})</span>
        </h1>
      </div>

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
        <p className="text-gray-500 text-sm">&quot;{query}&quot;에 해당하는 가드닝팁이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>
      )}
    </>
  );
}
