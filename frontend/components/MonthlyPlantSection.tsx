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
  const filtered = plants.filter((p) => p.bloom_months?.includes(month));

  return (
    <>
      <section className="py-8">
        <h2 className="text-sm font-bold text-plant-primary mb-3">월별 추천 식물</h2>
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonth(m)}
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
          <PlantGrid plants={filtered} />
        )}
      </section>
    </>
  );
}
