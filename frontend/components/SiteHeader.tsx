import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import HeaderAccountButton from "@/components/HeaderAccountButton";
import SearchBar from "@/components/SearchBar";

const NAV_LINKS = [
  { label: "홈", href: "/", enabled: true },
  { label: "전체 식물", href: "/plants", enabled: true },
  { label: "가드닝팁", href: "/guide", enabled: true },
  { label: "마이가든", href: "/my-garden", enabled: true },
] as const;

export default function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2 no-underline shrink-0" aria-label="NEMONE PLANTS 홈">
          {/* 모바일: 아이콘+텍스트, 데스크톱: 가로형 로고 이미지(제공 자산의 여백 제거본) */}
          <span className="flex sm:hidden items-center gap-1.5">
            {/* next/image는 dangerouslyAllowSVG 없이 svg를 최적화 못 해 순수 img 사용 */}
            <img src="/brand/plants-green-icon-outline.svg" alt="" width={22} height={22} className="w-[22px] h-[22px]" aria-hidden="true" />
            <span className="font-bold text-plant-primary tracking-wide">PLANTS</span>
          </span>
          <Image
            src="/brand/logo-horizontal.png"
            alt="NEMONE PLANTS"
            width={952}
            height={256}
            priority
            className="hidden sm:block h-8 w-auto"
          />
        </Link>

        {/* 검색바 — 맛매치처럼 타이틀 중앙에 배치, 제출 시 /plants?q=...로 이동해 실제 검색 수행 */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="w-full max-w-[220px] sm:max-w-xs">
            <Suspense fallback={<div className="h-8 rounded-full bg-[#F4F6F4] border border-gray-200" />}>
              <SearchBar />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <nav className="hidden sm:flex items-center gap-4" aria-label="주요 메뉴">
            {NAV_LINKS.map(({ label, href, enabled }) =>
              enabled ? (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium text-gray-600 hover:text-plant-primary no-underline"
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={href}
                  aria-disabled="true"
                  title="준비 중입니다"
                  className="text-[13px] font-medium text-gray-300 cursor-not-allowed select-none"
                >
                  {label}
                </span>
              )
            )}
          </nav>

          {/* 로그인/프로필 — 네모네 통합 인증(auth.nemoneai.com) 연동 */}
          <HeaderAccountButton />
        </div>
      </div>

      {/* 브랜드 슬로건 띠 — 맛매치 헤더 하단 태그라인과 동일한 패턴 */}
      <div className="border-t border-gray-100 py-1.5">
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.15em] text-center">
          초보집사의 성장을 응원합니다.
        </p>
      </div>
    </header>
  );
}
