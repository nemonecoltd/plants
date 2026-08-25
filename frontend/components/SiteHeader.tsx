import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
        <Link href="/" className="inline-flex items-center gap-2 no-underline" aria-label="NEMONE PLANTS 홈">
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
      </div>
    </header>
  );
}
