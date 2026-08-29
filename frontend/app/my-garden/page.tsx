"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import GuideCard from "@/components/GuideCard";
import PlantCard from "@/components/PlantCard";
import { useSaved } from "@/components/SavedProvider";
import type { Diagnosis, GuideSummary, PlantSummary } from "@/lib/api";

// 계정 하나로 여러 서비스를 쓰는데 이동 동선이 없어서 하단에 배치(AIM/PACE 마이페이지와 동일).
// PLANTS는 이 페이지 자신이라 제외. 와랑스튜디오는 통합 인증 대상은 아니지만
// home.nemoneai.com에 소개된 네모네 랩 프로젝트라 서비스 소개 차원에서 포함(2026-08-30, MSM 대체).
const NEMONE_SERVICES = [
  { name: '네모네AIM', href: "https://nemoneai.com", icon: "📰", desc: "당신 시간의 알찬 소비" },
  { name: "NEMONE PACE", href: "https://now.nemoneai.com", icon: "🗺️", desc: "당신의 다음 3시간을 설계합니다" },
  { name: "와랑스튜디오", href: "https://naver.me/FDGH15XY", icon: "🌿", desc: "제주 · NEMONE LAB" },
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

const DIAGNOSIS_STATUS: Record<string, { label: string; badge: string }> = {
  healthy: { label: "건강해요", badge: "bg-plant-primary text-white" },
  caution: { label: "살펴볼 점", badge: "bg-amber-500 text-white" },
  danger: { label: "조치 필요", badge: "bg-red-500 text-white" },
  unknown: { label: "식별 불가", badge: "bg-gray-400 text-white" },
};

export default function MyGardenPage() {
  const { user, isLoading: authLoading, signIn, signOut, profileUrl } = useAuth();
  const { isSaved } = useSaved();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"plants" | "guides" | "diagnoses">("plants");

  const load = useCallback(async () => {
    if (!user) return;
    const uid = encodeURIComponent(user.id);
    try {
      // 저장 목록과 진단 기록은 서로 독립이라 한쪽이 실패해도 나머지는 보여준다
      const [gardenRes, diagRes] = await Promise.allSettled([
        fetch(`/api/me/garden?user_id=${uid}`),
        fetch(`/api/me/diagnoses?user_id=${uid}`),
      ]);
      if (gardenRes.status === "fulfilled" && gardenRes.value.ok) {
        setGarden(await gardenRes.value.json());
      }
      if (diagRes.status === "fulfilled" && diagRes.value.ok) {
        const data = await diagRes.value.json();
        setDiagnoses(data.items ?? []);
        setRemaining(data.remaining_today ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleVisibility = useCallback(
    async (id: number, next: boolean) => {
      if (!user) return;
      const before = diagnoses;
      setDiagnoses((list) => list.map((d) => (d.id === id ? { ...d, is_public: next } : d)));
      const res = await fetch(`/api/me/diagnoses/${id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, is_public: next }),
      });
      if (!res.ok) setDiagnoses(before);
    },
    [user, diagnoses]
  );

  const removeDiagnosis = useCallback(
    async (id: number) => {
      if (!user) return;
      // 낙관적 제거 — 실패하면 되돌린다
      const before = diagnoses;
      setDiagnoses((list) => list.filter((d) => d.id !== id));
      const res = await fetch(
        `/api/me/diagnoses/${id}?user_id=${encodeURIComponent(user.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) setDiagnoses(before);
    },
    [user, diagnoses]
  );

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
              {user.email === "nemonecoltd@gmail.com" && (
                <Link href="/admin" className="text-[11px] font-medium text-plant-primary no-underline">
                  관리자 →
                </Link>
              )}
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

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <TabButton active={tab === "plants"} onClick={() => setTab("plants")}>
            저장한 식물 ({visiblePlants.length})
          </TabButton>
          <TabButton active={tab === "guides"} onClick={() => setTab("guides")}>
            저장한 가드닝팁 ({visibleGuides.length})
          </TabButton>
          <TabButton active={tab === "diagnoses"} onClick={() => setTab("diagnoses")}>
            AI 진단 기록 ({diagnoses.length})
          </TabButton>
        </div>

        {tab === "diagnoses" ? (
          <DiagnosisList
            items={diagnoses}
            remaining={remaining}
            onDelete={removeDiagnosis}
            onToggleVisibility={toggleVisibility}
          />
        ) : tab === "plants" ? (
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

// 진단 기록은 "저장한 목록"과 성격이 달라(내가 만든 기록) 카드 그리드 대신
// 날짜순 타임라인으로 보여준다 — 같은 식물을 여러 번 찍으면 변화가 읽히도록.
function DiagnosisList({
  items,
  remaining,
  onDelete,
  onToggleVisibility,
}: {
  items: Diagnosis[];
  remaining: number | null;
  onDelete: (id: number) => void;
  onToggleVisibility: (id: number, next: boolean) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-8">
        <p className="text-gray-500 text-sm mb-1">아직 진단 기록이 없어요.</p>
        <p className="text-gray-400 text-[13px] mb-4">
          식물 사진을 올리면 상태를 살펴보고 이곳에 기록으로 남겨드려요.
        </p>
        <Link
          href="/diagnose"
          className="inline-block px-6 py-2.5 rounded-full bg-plant-primary text-white text-xs font-bold no-underline hover:opacity-90"
        >
          내 식물 진단하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {remaining !== null && (
        <p className="text-[11px] text-gray-400">
          {remaining > 0
            ? `오늘 ${remaining}번 더 진단할 수 있어요`
            : "오늘의 진단을 모두 사용했어요. 내일 다시 만나요."}
        </p>
      )}

      {items.map((d) => {
        const status = DIAGNOSIS_STATUS[d.status] ?? DIAGNOSIS_STATUS.unknown;
        return (
          <article key={d.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image_url}
                alt=""
                className="w-20 h-20 rounded-lg object-cover shrink-0 bg-plant-secondary/10"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badge}`}>
                    {status.label}
                  </span>
                  <span className="text-[13px] font-bold text-plant-primary truncate">
                    {d.plant_name ?? "이름 미상"}
                  </span>
                </div>
                {d.headline && (
                  <p className="text-[13px] text-gray-700 leading-snug mb-2">{d.headline}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-400">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString("ko-KR") : ""}
                  </span>
                  {/* 공개 상태일 때만 상세 URL이 열린다(비공개는 백엔드가 404) */}
                  {d.is_public && (
                    <Link
                      href={`/diagnose/${d.id}`}
                      className="text-[10px] text-plant-primary no-underline hover:underline"
                    >
                      진단 전문 보기 →
                    </Link>
                  )}
                  {d.matched_plant_slug && (
                    <Link
                      href={`/plants/${d.matched_plant_slug}`}
                      className="text-[10px] text-plant-secondary no-underline hover:underline"
                    >
                      도감 →
                    </Link>
                  )}
                  {/* 진단은 기본적으로 익명으로 공개 피드에 올라간다 — 집 안이 찍혔거나
                      보여주고 싶지 않으면 여기서 바로 내릴 수 있게 함 */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(d.id, !d.is_public)}
                    aria-pressed={d.is_public}
                    className={`text-[10px] ml-auto ${
                      d.is_public
                        ? "text-plant-secondary hover:text-plant-primary"
                        : "text-gray-400 hover:text-plant-primary"
                    }`}
                  >
                    {d.is_public ? "공개 중 · 내리기" : "비공개 · 공개하기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    className="text-[10px] text-gray-300 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>

            {d.body_html && (
              <details className="border-t border-gray-100">
                <summary className="px-4 py-2.5 text-[11px] font-medium text-plant-secondary cursor-pointer hover:text-plant-primary list-none">
                  진단 내용 자세히 보기
                </summary>
                <div
                  className="px-4 pb-4 text-[13px] text-gray-700 leading-[1.8] [&_h2]:text-[12px] [&_h2]:font-bold [&_h2]:text-plant-primary [&_h2]:mt-4 [&_h2]:mb-1.5 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: d.body_html }}
                />
                {d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                    {d.tags.map((t) => (
                      <Link
                        key={t}
                        href={`/guide/tag/${encodeURIComponent(t)}`}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-plant-secondary/15 text-plant-primary no-underline hover:bg-plant-secondary/25"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}
              </details>
            )}
          </article>
        );
      })}
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
