import Link from "next/link";

// 글 하단 광고 위에 붙이는 "내 식물도 확인해보기" 띠배너. 진단 페이지로 내부 링크를 흘려보내는 역할도 겸한다.
// (가이드 글 /guide/[slug] 하단과 같은 모양 — 매거진 글에도 동일하게 쓴다.)
export default function DiagnoseCta() {
  return (
    <Link
      href="/diagnose"
      className="mt-6 flex items-center gap-4 bg-plant-primary rounded-2xl px-5 py-4 no-underline group"
    >
      <span className="text-2xl shrink-0" aria-hidden="true">📷</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-white leading-snug">우리 집 식물도 이런 상태인가요?</span>
        <span className="block text-[11px] text-white/70 mt-0.5">사진 한 장으로 지금 상태를 확인해 보세요</span>
      </span>
      <span className="text-white/80 text-sm shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
    </Link>
  );
}
