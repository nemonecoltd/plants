"use client";

import { useAuth } from "@/components/AuthProvider";
import { useSaved } from "@/components/SavedProvider";

type Kind = "plant" | "guide";

// 카드 위에 겹쳐 쓰는 용도(overlay)와 상세페이지 본문에 쓰는 용도(inline) 두 가지 모양
export default function SaveButton({
  kind,
  slug,
  variant = "overlay",
}: {
  kind: Kind;
  slug: string;
  variant?: "overlay" | "inline";
}) {
  const { user, isLoading, signIn } = useAuth();
  const { isSaved, toggle } = useSaved();
  const saved = user ? isSaved(kind, slug) : false;

  const handleClick = (e: React.MouseEvent) => {
    // 카드 전체가 링크라 하트만 눌렀을 때 상세로 이동하지 않도록 차단
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      signIn();
      return;
    }
    void toggle(kind, slug);
  };

  if (isLoading) return null;

  const label = saved ? "마이가든에서 빼기" : "마이가든에 저장";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
          saved
            ? "bg-plant-primary text-white border-plant-primary"
            : "bg-white text-gray-500 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
        }`}
      >
        <HeartIcon filled={saved} />
        {saved ? "저장됨" : "마이가든에 저장"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
        saved ? "bg-plant-primary text-white" : "bg-black/30 text-white hover:bg-black/50"
      }`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      style={{ stroke: "currentColor", strokeWidth: 2, fill: filled ? "currentColor" : "none" }}
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5C.8 8 2.2 4.5 5.7 4c2-.3 3.7.7 4.3 2.3.6-1.6 2.3-2.6 4.3-2.3 3.5.5 4.9 4 3.2 7.5C19 15.65 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
