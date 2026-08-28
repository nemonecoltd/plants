"use client";
import { useEffect, useRef } from "react";

export default function AdBanner({
  dataAdSlot,
  variant = "auto",
}: {
  dataAdSlot: string;
  // "auto": 기존 방식(높이를 구글이 알아서 정함, 세로로 커질 수 있음)
  // "horizontal-slim": 미디어쿼리로 높이를 직접 고정한 가로형 띠 배너(PC/모바일 모두 슬림하게)
  variant?: "auto" | "horizontal-slim";
}) {
  const insRef = useRef<HTMLModElement>(null);
  const isSlim = variant === "horizontal-slim";

  useEffect(() => {
    // 개발 모드 React StrictMode가 마운트를 두 번 실행하면서 같은 <ins>에
    // push()가 중복 호출돼 "already have ads in them" 에러가 나던 문제 —
    // 이미 초기화된(status 속성이 붙은) ins면 다시 push하지 않도록 가드.
    if (insRef.current?.getAttribute("data-adsbygoogle-status")) return;
    try {
      // @ts-expect-error adsbygoogle는 외부 스크립트가 주입하는 전역
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  // flex 컨테이너로 감싸면 <ins>가 flex item으로 폭 0이 되어
  // "Invalid responsive width: 0" 에러가 나므로 block 레벨 컨테이너로 폭을 그대로 물려줌
  return (
    <div className="w-full overflow-hidden">
      <ins
        ref={insRef}
        className={`adsbygoogle${isSlim ? " ad-banner-slim" : ""}`}
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-4274957638983041"
        data-ad-slot={dataAdSlot}
        data-ad-format={isSlim ? "horizontal" : "auto"}
        data-full-width-responsive={isSlim ? "false" : "true"}
      />
    </div>
  );
}
