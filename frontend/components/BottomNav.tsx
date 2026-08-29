"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "홈", href: "/", enabled: true, icon: HomeIcon },
  { label: "전체 식물", href: "/plants", enabled: true, icon: LeafIcon },
  // 진단은 이 서비스의 정체성이라 가운데(엄지가 가장 닿기 쉬운 자리)에 둔다
  { label: "AI 진단", href: "/diagnose", enabled: true, icon: CameraIcon },
  { label: "가드닝팁", href: "/guide", enabled: true, icon: BookIcon },
  { label: "마이가든", href: "/my-garden", enabled: true, icon: HeartIcon },
] as const;

// 헤더의 상단 메뉴가 sm 이상에서만 보이므로(로고와 겹쳐 좁은 화면에서 잘림),
// 그 아래 화면(모바일)은 이 하단 탭바가 유일한 내비게이션 수단이 된다.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full sm:hidden z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="하단 메뉴"
    >
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ label, href, enabled, icon: Icon }) => {
          const isActive = enabled && (pathname === href || (href !== "/" && pathname.startsWith(href)));
          if (!enabled) {
            return (
              <span
                key={href}
                aria-disabled="true"
                title="준비 중입니다"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-300 select-none"
              >
                <Icon />
                <span className="text-[10px] font-medium">{label}</span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 no-underline ${
                isActive ? "text-plant-primary" : "text-gray-400"
              }`}
            >
              <Icon />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <path d="M4 20c8 0 16-6 16-16-10 0-16 8-16 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20c0-5 3-9 8-11" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.3 4.7h5.4a1 1 0 0 1 .84.42l.92 1.42a1 1 0 0 0 .84.46h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <path
        d="M12 20s-7-4.35-9.5-8.5C.8 8 2.2 4.5 5.7 4c2-.3 3.7.7 4.3 2.3.6-1.6 2.3-2.6 4.3-2.3 3.5.5 4.9 4 3.2 7.5C19 15.65 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
