import type { ReactNode } from "react";
import AdBanner from "@/components/AdBanner";
import PlantCard from "@/components/PlantCard";
import type { PlantSummary } from "@/lib/api";

// 그리드는 모바일 2열/PC 4열이라, "2줄 뒤"가 PC는 8번째, 모바일은 6번째 카드 뒤가 된다.
// 광고 두 개를 각각의 위치에 심어두고 미디어쿼리로 하나만 보이게 함 — display:none인
// 요소는 CSS Grid 흐름에서 완전히 빠지므로 항상 정확히 하나의 광고만 실제로 자리를 차지한다.
const MOBILE_AD_AFTER = 6;
const DESKTOP_AD_AFTER = 8;

export default function PlantGrid({ plants }: { plants: PlantSummary[] }) {
  if (plants.length === 0) {
    return <p className="text-gray-500 text-sm">등록된 식물이 없습니다.</p>;
  }

  const nodes: ReactNode[] = [];
  plants.forEach((p, i) => {
    nodes.push(<PlantCard key={p.slug} plant={p} />);
    const position = i + 1;
    if (position === MOBILE_AD_AFTER) {
      nodes.push(
        <div key="ad-mobile" className="col-span-full md:hidden">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      );
    }
    if (position === DESKTOP_AD_AFTER) {
      nodes.push(
        <div key="ad-desktop" className="col-span-full hidden md:block">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      );
    }
  });

  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>;
}
