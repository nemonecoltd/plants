import Image from "next/image";
import Link from "next/link";
import type { PlantSummary } from "@/lib/api";
import { getPlantImage } from "@/lib/placeholderImages";

const SUNLIGHT_LABEL: Record<string, string> = {
  full_sun: "양지",
  part_shade: "반음지",
  full_shade: "음지",
};

export default function PlantCard({ plant }: { plant: PlantSummary }) {
  const img = getPlantImage(plant);
  return (
    <Link
      href={`/plants/${plant.slug}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline"
    >
      <div className="relative aspect-[4/3] bg-plant-secondary/10">
        {img ? (
          <Image src={img} alt={plant.name_kr} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]">
            이미지 준비 중
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-[11px] text-plant-secondary mb-1">{plant.category}</div>
        <div className="font-bold text-plant-primary mb-1">{plant.name_kr}</div>
        {plant.name_en && <div className="text-[11px] text-gray-400 italic mb-2">{plant.name_en}</div>}
        <div className="flex flex-wrap gap-1">
          {plant.sunlight && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
              {SUNLIGHT_LABEL[plant.sunlight] ?? plant.sunlight}
            </span>
          )}
          {plant.difficulty && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-plant-secondary/15 text-plant-primary">
              난이도 {plant.difficulty}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
