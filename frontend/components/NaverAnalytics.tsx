"use client";

import Script from "next/script";

// wcslog.js가 로드되며 주입하는 전역 — 별도 타입 선언이 없는 외부 스크립트라 최소한의 형태만 캐스팅
type NaverWindow = Window & {
  wcs_add?: Record<string, string>;
  wcs?: unknown;
  wcs_do?: (...args: unknown[]) => void;
};

export default function NaverAnalytics() {
  return (
    <Script
      src="//wcs.pstatic.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={() => {
        const w = window as NaverWindow;
        w.wcs_add = w.wcs_add || {};
        w.wcs_add["wa"] = "640b7a352298";
        if (w.wcs) {
          w.wcs_do?.();
        }
      }}
    />
  );
}
