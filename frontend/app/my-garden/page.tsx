"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import GuideCard from "@/components/GuideCard";
import PlantCard from "@/components/PlantCard";
import { useSaved } from "@/components/SavedProvider";
import type { GuideSummary, PlantSummary } from "@/lib/api";

// 계정 하나로 여러 서비스를 쓰는데 이동 동선이 없어서 하단에 배치(AIM/PACE 마이페이지와 동일).
// PLANTS는 이 페이지 자신이라 제외, MSM은 아직 통합 인증 대상이 아니지만 서비스 소개 차원에서 포함.
const NEMONE_SERVICES = [
  { name: '네모네AIM', href: "https://nemoneai.com", icon: "📰", desc: "당신 시간의 알찬 소비" },
  { name: "NEMONE PACE", href: "https://now.nemoneai.com", icon: "🗺️", desc: "당신의 다음 3시간을 설계합니다" },
  { name: "NEMONE MSM", href: "https://msm.nemoneai.com", icon: "📈", desc: "국내 주식 AI 분석" },
];

type Notice = {
  type: "bloom" | "planting";
  month: number;
  message: string;
  items: { slug: string; name_kr: string }[];
};

type Garden = {
  plants: PlantSummary[];
  guides: GuideSummary[];
  notices: Notice[];
};

export default function MyGardenPage() {
  const { user, isLoading: authLoading, signIn, signOut, profileUrl } = useAuth();
  const { isSaved } = useSaved();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"plants" | "guides">("plants");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/me/garden?user_id=${encodeURIComponent(user.id)}`);
      if (res.ok) setGarden(await res.json());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user, authLoading, load]);

  // 하트를 눌러 해제하면 목록에서도 즉시 빠지도록(재조회 없이) 필터링
  const visiblePlants = (garden?.plants ?? []).filter((p) => isSaved("plant", p.slug));
  const visibleGuides = (garden?.guides ?? []).filter((g) => isSaved("guide", g.slug));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F4]">
        <main className="max-w-5xl mx-auto px-6 py-16 text-center text-sm text-gray-400">
          불러오는 중…
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F6F4]">
        <main className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-xl font-bold text-plant-primary mb-2">마이가든</h1>
          <p className="text-sm text-gray-500 mb-8">
            마음에 드는 식물과 가드닝팁을 저장하고,
            <br />
            개화·파종 시기를 알림으로 받아보세요.
          </p>
          <button
            type="button"
            onClick={signIn}
            className="inline-block px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            네모네 계정으로 로그인
          </button>
        </main>
      </div>
    );
  }

  const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "회원";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const notices = garden?.notices ?? [];

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 프로필 — 이름/사진은 네모네 공용 계정 정보라 수정은 인증 센터로 보냄 */}
        <section className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-plant-secondary/15 flex items-center justify-center shrink-0">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-plant-primary font-bold text-lg">{name.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-plant-primary truncate">{name}</div>
              <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <a
                href={`${profileUrl}?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                className="text-[11px] font-medium text-plant-secondary hover:text-plant-primary no-underline"
              >
                계정 관리 →
              </a>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                로그아웃
              </button>
            </div>
          </div>
        </section>

        {/* 알림 — 저장한 식물의 개화/파종 시기가 이번 달과 겹칠 때만 노출 */}
        {notices.length > 0 && (
          <section className="mb-6 space-y-2">
            {notices.map((n) => (
              <div
                key={n.type}
                className="flex items-start gap-2.5 bg-plant-secondary/10 border border-plant-secondary/20 rounded-lg px-4 py-3"
              >
                <span aria-hidden="true" className="text-base leading-none mt-0.5">
                  {n.type === "bloom" ? "🌸" : "🌱"}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-plant-primary">{n.message}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {n.items.map((it) => (
                      <Link
                        key={it.slug}
                        href={`/plants/${it.slug}`}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-white text-plant-primary border border-plant-secondary/30 no-underline hover:border-plant-primary"
                      >
                        {it.name_kr}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="flex items-center gap-2 mb-4">
          <TabButton active={tab === "plants"} onClick={() => setTab("plants")}>
            저장한 식물 ({visiblePlants.length})
          </TabButton>
          <TabButton active={tab === "guides"} onClick={() => setTab("guides")}>
            저장한 가드닝팁 ({visibleGuides.length})
          </TabButton>
        </div>

        {tab === "plants" ? (
          visiblePlants.length === 0 ? (
            <EmptyState
              message="아직 저장한 식물이 없어요."
              linkHref="/plants"
              linkLabel="식물도감 둘러보기"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visiblePlants.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          )
        ) : visibleGuides.length === 0 ? (
          <EmptyState
            message="아직 저장한 가드닝팁이 없어요."
            linkHref="/guide"
            linkLabel="가드닝팁 둘러보기"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleGuides.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        )}

        {/* 네모네 다른 서비스 */}
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-[11px] font-bold text-gray-400 tracking-wider mb-4">네모네의 다른 서비스</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NEMONE_SERVICES.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3.5 hover:border-plant-primary transition-colors no-underline"
              >
                <span className="text-lg shrink-0">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-plant-primary truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{s.desc}</p>
                </div>
                <span className="text-gray-300 text-xs shrink-0" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-plant-primary text-white border-plant-primary"
          : "bg-white text-gray-500 border-gray-200 hover:border-plant-primary hover:text-plant-primary"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  message,
  linkHref,
  linkLabel,
}: {
  message: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <p className="text-gray-500 text-sm py-8">
      {message}{" "}
      <Link href={linkHref} className="text-plant-primary underline">
        {linkLabel}
      </Link>
    </p>
  );
}
