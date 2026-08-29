import type { Metadata } from "next";

// 마이가든은 로그인해야 내용이 보이는 개인 페이지 — 크롤러에겐 빈 껍데기만 보이므로
// 색인 대상에서 제외한다(sitemap에도 미포함). 페이지 본문이 "use client"라
// metadata를 직접 export할 수 없어 레이아웃으로 분리.
export const metadata: Metadata = {
  title: "마이가든",
  description: "저장한 식물과 가드닝팁을 모아보고, 개화·파종 시기 알림을 확인하세요.",
  robots: { index: false, follow: true },
};

export default function MyGardenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
