"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

// 로그인 전: 통합 인증 센터로 보내는 버튼 / 로그인 후: 마이가든으로 가는 프로필 아바타
export default function HeaderAccountButton() {
  const { user, isLoading, signIn } = useAuth();

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        title="로그인"
        aria-label="로그인"
        className="w-8 h-8 rounded-full border-[1.5px] border-plant-primary text-plant-primary flex items-center justify-center shrink-0 hover:bg-plant-primary hover:text-white transition-colors"
      >
        <UserIcon />
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name as string) || user.email || "";

  return (
    <Link
      href="/my-garden"
      title="마이가든"
      aria-label="마이가든"
      className="w-8 h-8 rounded-full overflow-hidden border-[1.5px] border-plant-primary shrink-0 flex items-center justify-center bg-plant-secondary/15 no-underline"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[11px] font-bold text-plant-primary">{name.slice(0, 1)}</span>
      )}
    </Link>
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
