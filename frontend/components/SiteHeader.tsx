import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "홈", href: "/", enabled: true },
  { label: "전체 식물", href: "/plants", enabled: true },
  { label: "가드닝팁", href: "/guide", enabled: true },
  { label: "마이가든", href: "/my-garden", enabled: false },
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

        {/* 검색바 — 맛매치처럼 타이틀 중앙에 배치, 아직 실제 검색은 미연동(디자인 단계) */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="flex items-center w-full max-w-[220px] sm:max-w-xs rounded-full bg-[#F4F6F4] border border-gray-200 overflow-hidden">
            <input
              type="text"
              placeholder="식물 이름 검색 (준비 중)"
              disabled
              aria-disabled="true"
              className="flex-1 min-w-0 bg-transparent px-4 py-1.5 text-xs text-gray-600 placeholder:text-gray-400 outline-none disabled:cursor-not-allowed"
            />
            <span className="flex items-center justify-center w-8 text-plant-secondary shrink-0">
              <SearchIcon />
            </span>
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

          {/* 로그인 — 아직 인증 미연동, msm/matmatch와 동일하게 원형 아이콘 버튼만 준비 */}
          <button
            type="button"
            aria-disabled="true"
            title="로그인 준비 중입니다"
            className="w-8 h-8 rounded-full border-[1.5px] border-plant-primary text-plant-primary flex items-center justify-center shrink-0 cursor-not-allowed opacity-70"
          >
            <UserIcon />
          </button>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: "currentColor", strokeWidth: 2, fill: "none" }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}
