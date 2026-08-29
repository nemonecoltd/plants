"use client";

import Link from "next/link";
import { useState } from "react";
import PlantGrid from "@/components/PlantGrid";
import type { PlantSummary } from "@/lib/api";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MonthlyPlantSection({
  plants,
  totalCount,
  initialMonth,
}: {
  plants: PlantSummary[];
  totalCount: number;
  initialMonth: number;
}) {
  const [month, setMonth] = useState(initialMonth);
  // 한 달에 17종씩 걸리는 달도 있어 메인이 이 그리드로만 길어졌다. 처음엔 4개만 보여주고
  // 원하는 사람만 펼치게 한다(달을 바꾸면 다시 접힘 — 새 달을 처음부터 다 펼쳐 보여줄
  // 이유가 없고, 접힌 상태가 이 섹션의 기본값이라 일관성도 유지된다).
  const [expanded, setExpanded] = useState(false);
  const filtered = plants.filter((p) => p.bloom_months?.includes(month));
  const PREVIEW_COUNT = 4;
  const visible = expanded ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hiddenCount = filtered.length - visible.length;

  const selectMonth = (m: number) => {
    setMonth(m);
    setExpanded(false);
  };

  return (
    <>
      <section className="py-8">
        <h2 className="text-sm font-bold text-plant-primary mb-3">월별 추천 식물</h2>
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => selectMonth(m)}
              aria-pressed={m === month}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                m === month
                  ? "bg-plant-primary text-white border-plant-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
              }`}
            >
              {m}월
            </button>
          ))}
        </div>
      </section>

      <section className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-plant-primary">
            {month}월 개화 식물 ({filtered.length})
          </h2>
          <Link href="/plants" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
            전체 식물도감 보기 ({totalCount}) →
          </Link>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {month}월 개화 정보가 확인된 식물이 아직 없어요.{" "}
            <Link href="/plants" className="text-plant-primary underline">
              전체 식물 보러가기
            </Link>
          </p>
        ) : (
          // 메인화면은 이 광고를 그리드 중간이 아니라 하단 가드닝팁 위로 옮겨 배치하므로 끔
          <>
            <PlantGrid plants={visible} showAd={false} />
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-4 w-full py-3 rounded-full border border-gray-200 bg-white text-xs font-bold text-plant-primary hover:border-plant-primary transition-colors"
              >
                {month}월 개화 식물 {hiddenCount}개 더보기
              </button>
            )}
            {expanded && filtered.length > PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="mt-4 w-full py-3 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-plant-primary hover:text-plant-primary transition-colors"
              >
                접기
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}
