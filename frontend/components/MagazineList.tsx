"use client";

import { useEffect, useState } from "react";
import MagazineCard from "@/components/MagazineCard";
import type { MagazineSummary } from "@/lib/api";

// PACE의 매거진 탭과 동일 패턴 — 서버에서 미리 안 가져오고 탭 열 때 클라이언트에서
// /api/magazine 호출(맛매치 프록시라 매번 최신 상태를 그대로 보여줌).
export default function MagazineList() {
  const [posts, setPosts] = useState<MagazineSummary[] | null>(null);
  // 글이 늘어도 목록이 끝없이 길어지지 않게 20개씩 "더 보기"(2026-10-24 — 예전엔 Special 20개 상한으로 막았음)
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    fetch("/api/magazine")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  if (posts === null) {
    return <p className="text-gray-400 text-sm py-8 text-center">불러오는 중...</p>;
  }

  if (posts.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">아직 매거진 글이 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {posts.slice(0, visible).map((p) => (
        <MagazineCard key={p.id} post={p} />
      ))}
      {posts.length > visible && (
        <button
          onClick={() => setVisible((v) => v + 20)}
          className="col-span-full py-3 rounded-lg border border-gray-200 bg-white text-sm font-bold text-plant-secondary hover:border-plant-primary"
        >
          더 보기 ({visible}/{posts.length})
        </button>
      )}
    </div>
  );
}
