const NAV_LINKS = [
  { name: "ABOUT", href: "https://home.nemoneai.com" },
  { name: "네모네AIM", href: "https://nemoneai.com" },
  { name: "NEMONE PACE", href: "https://now.nemoneai.com" },
  { name: "와랑 스튜디오", href: "https://naver.me/FDGH15XY" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-10 pt-8 pb-10 border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-[11px] font-black text-plant-primary tracking-[0.2em] uppercase">
            NEMONE PLANTS
          </span>
          <span className="text-[10px] font-bold text-gray-500 tracking-wide">
            당신과 식물이 함께 자라는 시간
          </span>
          <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">
            © NEMONE INC. ALL RIGHTS RESERVED.
          </span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {NAV_LINKS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-black text-gray-500 hover:text-plant-primary tracking-[0.25em] uppercase transition-colors no-underline"
            >
              {item.name}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
