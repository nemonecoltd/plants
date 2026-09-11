"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// target 기본값 "/search" — 식물+TIPS를 함께 보여주는 통합 검색 결과 페이지(2026-09-11).
// 전역 헤더(SiteHeader)의 검색창은 이 기본값을 그대로 쓰고, /plants 페이지 안에 있는
// 검색창만 target="/plants"로 넘겨 기존처럼 식물 목록 안에서의 필터링을 유지한다
// (이미 분류·페이지네이션이 그 페이지 흐름에 맞춰져 있어 굳이 통합 페이지로 보낼 이유가 없음).
export default function SearchBar({
  target = "/search",
  placeholder = "식물·TIPS 검색",
}: {
  target?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // 페이지 이동 뒤에도 주소창의 q와 입력값이 어긋나지 않도록 동기화
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `${target}?q=${encodeURIComponent(trimmed)}` : target);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center w-full rounded-full bg-[#F4F6F4] border border-gray-200 overflow-hidden focus-within:border-plant-primary transition-colors"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent px-4 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 outline-none"
      />
      <button
        type="submit"
        aria-label="검색"
        className="flex items-center justify-center w-8 text-plant-secondary shrink-0 hover:text-plant-primary transition-colors"
      >
        <SearchIcon />
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}
