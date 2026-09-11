import Link from "next/link";

// 메인 최상단 — "정보를 찾아보는 곳"이 아니라 "내 식물을 같이 들여다보는 곳"이라는
// 서비스 정체성을 첫 화면에서 바로 보여주는 자리. 실제 촬영/업로드는 /diagnose에서
// 하지만(로그인·업로드 상태를 메인에 끌고 오면 첫 로딩이 무거워짐), 여기서 그 행동을
// 분명하게 제안한다.
export default function DiagnoseHero({ attachedTop = false }: { attachedTop?: boolean }) {
  return (
    <section className={`max-w-5xl mx-auto px-6 ${attachedTop ? "" : "pt-6"}`}>
      <Link
        href="/diagnose"
        className={`group block relative overflow-hidden bg-plant-primary no-underline ${
          attachedTop ? "rounded-b-2xl" : "rounded-2xl"
        }`}
      >
        {/* 배경 사진(2026-09-07 추가) — 텍스트가 사진 위에서도 읽히도록 브랜드 그린 톤 그라디언트를
            겹친다(순수 검정 대신 plant-primary를 써서 사진이 바뀌어도 브랜드 톤 유지). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero/diagnose-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-plant-primary/95 via-plant-primary/75 to-plant-primary/40" />

        <div className="relative px-6 py-7 sm:px-8 sm:py-9 flex items-center gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-white/60 tracking-[0.18em] mb-2">
              AI PLANT COMPANION
            </p>
            <h2 className="text-[17px] sm:text-xl font-bold text-white leading-snug mb-1.5">
              잎이 노랗게 변했나요?
              <br />
              사진 한 장으로 같이 살펴봐요
            </h2>
            <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">
              어떤 식물인지, 지금 뭐가 문제인지, 무엇부터 해야 하는지
            </p>
            <span className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-full bg-white text-plant-primary text-[13px] font-bold group-hover:gap-2.5 transition-all">
              내 식물 진단하기
              <span aria-hidden="true">→</span>
            </span>
          </div>

          {/* 모바일에서는 문구가 우선이라 숨기고, 넓은 화면에서만 아이콘을 보인다.
              이모지는 폰트마다 렌더링이 달라(일부는 색이 들어간 그림으로 나옴) 브랜드
              톤과 안 맞아서, BottomNav의 진단 탭과 같은 선 스타일 SVG로 통일함 */}
          <div className="hidden sm:flex w-24 h-24 rounded-2xl bg-white/10 items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10"
              style={{ stroke: "white", strokeWidth: 1.5, fill: "none" }}
              aria-hidden="true"
            >
              <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.3 4.7h5.4a1 1 0 0 1 .84.42l.92 1.42a1 1 0 0 0 .84.46h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </div>
        </div>
      </Link>
    </section>
  );
}
