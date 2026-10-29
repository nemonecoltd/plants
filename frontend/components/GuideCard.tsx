import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import type { GuideSummary } from "@/lib/api";
import GuideThumb from "@/components/GuideThumb";

export default function GuideCard({ guide, rank }: { guide: GuideSummary; rank?: number }) {
  return (
    <Link
      href={`/guide/${guide.slug}`}
      className="relative block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline"
    >
      <SaveButton kind="guide" slug={guide.slug} />
      {rank && (
        <span
          aria-label={`${rank}위`}
          className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-black ${
            rank === 1 ? "bg-plant-primary text-white" : "bg-white/90 text-plant-primary"
          }`}
        >
          {rank}
        </span>
      )}
      <div className="relative aspect-[4/3] bg-plant-secondary/10">
        {guide.thumbnail_url ? (
          <GuideThumb src={guide.thumbnail_url} alt={guide.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]">
            이미지 준비 중
          </div>
        )}
      </div>
      <div className="p-4">
        {guide.category && <div className="text-[11px] text-plant-secondary mb-1">{guide.category}</div>}
        <div className="font-bold text-plant-primary text-sm leading-snug line-clamp-2">{guide.title}</div>
      </div>
    </Link>
  );
}
