"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // /plants로 이동한 뒤에도 주소창의 q와 입력값이 어긋나지 않도록 동기화
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/plants?q=${encodeURIComponent(trimmed)}` : "/plants");
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
        placeholder="식물 이름 검색"
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
