import type { ReactNode } from "react";
import AdBanner from "@/components/AdBanner";
import PlantCard from "@/components/PlantCard";
import type { PlantSummary } from "@/lib/api";

// "N번째 카드 다음"은 그 카드까지 채운 뒤 줄바꿈 지점에 광고를 끼워 넣는다는 뜻 —
// 4장 다음에 넣으면 PC(4열)는 1줄(4장) 다 채운 직후라 광고가 2번째 줄이 되고,
// 모바일(2열)은 2줄(4장) 다 채운 직후라 광고가 3번째 줄이 된다. 두 요구사항이
// 우연히 같은 숫자(4)로 맞아떨어져 반응형 분기 없이 광고 하나만 심으면 된다.
const AD_AFTER = 4;

export default function PlantGrid({ plants, showAd = true }: { plants: PlantSummary[]; showAd?: boolean }) {
  if (plants.length === 0) {
    return <p className="text-gray-500 text-sm">등록된 식물이 없습니다.</p>;
  }

  const nodes: ReactNode[] = [];
  plants.forEach((p, i) => {
    nodes.push(<PlantCard key={p.slug} plant={p} />);
    if (showAd && i + 1 === AD_AFTER) {
      nodes.push(
        <div key="ad" className="col-span-full">
          <AdBanner dataAdSlot="6819394440" />
        </div>
      );
    }
  });

  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{nodes}</div>;
}
