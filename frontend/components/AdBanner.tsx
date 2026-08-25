"use client";
import { useEffect } from "react";

export default function AdBanner({ dataAdSlot }: { dataAdSlot: string }) {
  useEffect(() => {
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
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4274957638983041"
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
