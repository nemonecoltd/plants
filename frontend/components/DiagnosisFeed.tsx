import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import DiagnosisImage from "@/components/DiagnosisImage";
import type { DiagnosisFeedItem, DiagnosisStatus } from "@/lib/api";

const STATUS_BADGE: Record<DiagnosisStatus, { label: string; className: string }> = {
  healthy: { label: "건강해요", className: "bg-plant-primary text-white" },
  caution: { label: "살펴볼 점", className: "bg-amber-500 text-white" },
  danger: { label: "조치 필요", className: "bg-red-500 text-white" },
  unknown: { label: "식별 불가", className: "bg-gray-400 text-white" },
};

// 다른 사람이 올린 진단을 함께 보는 피드. 작성자는 표시하지 않는다(백엔드도 user_id를
// 내려주지 않음) — 사진에 집 안이 찍힐 수 있어 "누가 올렸는지"까지 붙이면 부담이 커진다.
export default function DiagnosisFeed({
  items,
  columnsClassName = "grid-cols-2 sm:grid-cols-3",
  mobileVisibleCount,
  adAfter,
  adSlot,
}: {
  items: DiagnosisFeedItem[];
  columnsClassName?: string;
  // 모바일 2열/PC 3열처럼 열 수가 반응형으로 바뀌는 그리드는, 카드 개수가 열 수의
  // 배수가 아니면 모바일에서 어중간하게 다음 줄로 한 칸이 넘어가 아래 배치(광고 등)를
  // 밀어낸다. 지정하면 그 개수를 넘는 카드를 모바일에서만 숨겨(sm 이상에서는 그대로
  // 다 보임) 항상 딱 맞는 줄 수로 떨어지게 한다.
  mobileVisibleCount?: number;
  // 지정하면 이 순번(1-based) 카드 다음에 광고를 끼워 넣는다(GuideListClient의
  // TIPS 목록과 같은 패턴). 세로로 길어지는 auto 포맷 대신 horizontal-slim으로
  // 고정해 모바일에서 카드 그리드 높이를 광고가 과하게 밀어내지 않게 한다.
  adAfter?: number;
  adSlot?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`grid ${columnsClassName} gap-4`}>
      {items.flatMap((d, i) => {
        const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.unknown;
        const hiddenOnMobile = mobileVisibleCount !== undefined && i >= mobileVisibleCount;

        const card = (
          <Link
            key={d.id}
            // 카드를 누르면 진단 전문을 읽을 수 있어야 한다 — 도감으로 바로 보내면
            // 정작 궁금한 "이 식물이 왜 이런 상태인지"를 못 본 채 넘어간다
            href={`/diagnose/${d.id}`}
            className={`block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline ${hiddenOnMobile ? "hidden sm:block" : ""}`}
          >
            <div className="relative aspect-[4/3] bg-plant-secondary/10">
              {/* 사용자가 올린 사진은 백엔드가 /api/로 서빙해 next/image를 태우지 못한다
                  (GuideThumb의 설명과 같은 이유 — 빌드 시점에 굳은 rewrite 때문).
                  DiagnosisImage가 로드 실패 시 자리표시자로 대체(2026-09-11 사고 대응). */}
              <DiagnosisImage
                src={d.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span
                className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            <div className="p-3">
              <div className="text-[12px] font-bold text-plant-primary truncate mb-1">
                {d.plant_name ?? "이름 미상"}
              </div>
              {d.headline && (
                <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{d.headline}</p>
              )}
            </div>
          </Link>
        );

        if (adAfter !== undefined && adSlot && i + 1 === adAfter) {
          return [
            card,
            <div key="ad" className="col-span-full">
              <AdBanner dataAdSlot={adSlot} variant="horizontal-slim" />
            </div>,
          ];
        }
        return [card];
      })}
    </div>
  );
}
