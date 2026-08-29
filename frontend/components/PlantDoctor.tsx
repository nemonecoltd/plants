"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { compressImage } from "@/lib/compressImage";
import type { DiagnosisResponse, DiagnosisStatus } from "@/lib/api";

const STATUS_STYLE: Record<DiagnosisStatus, { label: string; badge: string; ring: string }> = {
  healthy: { label: "건강해요", badge: "bg-plant-primary text-white", ring: "border-plant-primary/30" },
  caution: { label: "살펴볼 점이 있어요", badge: "bg-amber-500 text-white", ring: "border-amber-300" },
  danger: { label: "빠른 조치가 필요해요", badge: "bg-red-500 text-white", ring: "border-red-300" },
  unknown: { label: "알아보기 어려워요", badge: "bg-gray-400 text-white", ring: "border-gray-200" },
};

// 진단은 10초 안팎이 걸린다. 스피너 하나만 돌리면 멈춘 것처럼 느껴져서, 실제로 진행
// 중인 단계를 순서대로 보여준다(내부 진행률이 아니라 체감용 메시지).
const PROGRESS_MESSAGES = [
  "사진을 살펴보고 있어요",
  "어떤 식물인지 찾아보는 중이에요",
  "잎과 줄기 상태를 확인하고 있어요",
  "진단 결과를 정리하고 있어요",
];

export default function PlantDoctor() {
  const { user, isLoading: authLoading, signIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  // 남은 횟수를 미리 보여줘야 "찍었는데 안 된다"는 상황을 만들지 않는다
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/me/diagnoses?user_id=${encodeURIComponent(user.id)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setRemaining(data.remaining_today);
      } catch {
        /* 남은 횟수는 보조 정보라 실패해도 진단 자체는 시도할 수 있게 둔다 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(
      () => setProgressStep((s) => Math.min(s + 1, PROGRESS_MESSAGES.length - 1)),
      2800
    );
    return () => clearInterval(timer);
  }, [busy]);

  // 미리보기용 objectURL은 결과가 바뀌거나 화면을 뜰 때 반드시 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) return;
      setError(null);
      setResult(null);
      setProgressStep(0);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      setBusy(true);

      try {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.append("user_id", user.id);
        form.append("file", compressed, "plant.jpg");

        const res = await fetch("/api/me/diagnose", { method: "POST", body: form });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.detail ?? "진단에 실패했어요. 잠시 후 다시 시도해 주세요.");
          return;
        }
        setResult(data);
        setRemaining(data.remaining_today);
      } catch {
        setError("네트워크 문제로 진단하지 못했어요. 다시 시도해 주세요.");
      } finally {
        setBusy(false);
      }
    },
    [user]
  );

  const reset = () => {
    setResult(null);
    setError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  if (authLoading) {
    return <div className="py-16 text-center text-sm text-gray-400">불러오는 중…</div>;
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="text-3xl mb-3" aria-hidden="true">🪴</div>
        <h2 className="text-base font-bold text-plant-primary mb-2">
          내 식물 사진으로 진단받기
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          진단 기록은 마이가든에 저장돼요.
          <br />
          네모네 계정으로 로그인하고 시작해 보세요.
        </p>
        <button
          type="button"
          onClick={signIn}
          className="px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          네모네 계정으로 로그인
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        // capture를 주면 모바일에서 앨범 대신 카메라가 바로 열린다. 다만 앨범 속
        // 사진으로 진단하려는 경우가 더 많아 기본 선택창을 그대로 쓴다.
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {busy ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="w-28 h-28 rounded-xl object-cover mx-auto mb-5 animate-pulse"
            />
          )}
          <p className="text-sm font-bold text-plant-primary mb-1.5">
            {PROGRESS_MESSAGES[progressStep]}
          </p>
          <p className="text-xs text-gray-400">10초 정도 걸려요. 잠시만 기다려 주세요.</p>
        </div>
      ) : result ? (
        <ResultView result={result} preview={preview} onReset={reset} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-3xl mb-3" aria-hidden="true">📷</div>
          <h2 className="text-base font-bold text-plant-primary mb-2">
            지금 우리 집 식물을 찍어보세요
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            잎이 잘 보이게 찍으면 더 정확해요.
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-8 py-3 rounded-full bg-plant-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            사진 선택하기
          </button>
          {remaining !== null && (
            <p className="text-[11px] text-gray-400 mt-4">
              {remaining > 0
                ? `오늘 ${remaining}번 더 진단할 수 있어요`
                : "오늘의 진단을 모두 사용했어요. 내일 다시 만나요."}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-600">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="text-[11px] text-red-500 underline mt-1"
          >
            다시 시도하기
          </button>
        </div>
      )}
    </div>
  );
}

function ResultView({
  result,
  preview,
  onReset,
}: {
  result: DiagnosisResponse;
  preview: string | null;
  onReset: () => void;
}) {
  const style = STATUS_STYLE[result.status] ?? STATUS_STYLE.unknown;

  return (
    <div className={`bg-white rounded-2xl border-2 ${style.ring} overflow-hidden`}>
      {(preview || result.image_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview ?? result.image_url}
          alt=""
          className="w-full max-h-72 object-cover"
        />
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
            {style.label}
          </span>
          {result.plant_name && (
            <span className="text-[13px] font-bold text-plant-primary truncate">
              {result.plant_name}
            </span>
          )}
        </div>

        {result.headline && (
          <p className="text-[15px] font-bold text-gray-800 leading-snug mb-4">
            {result.headline}
          </p>
        )}

        {result.body_html && (
          <div
            className="text-[14px] text-gray-700 leading-[1.8] [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-plant-primary [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: result.body_html }}
          />
        )}

        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {result.tags.map((t) => (
              <Link
                key={t}
                href={`/guide/tag/${encodeURIComponent(t)}`}
                className="text-[11px] px-2.5 py-1 rounded-full bg-plant-secondary/15 text-plant-primary no-underline hover:bg-plant-secondary/25 transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
          {result.matched_plant_slug && (
            <Link
              href={`/plants/${result.matched_plant_slug}`}
              className="text-xs font-bold px-4 py-2 rounded-full bg-plant-primary text-white no-underline hover:opacity-90"
            >
              도감에서 자세히 보기 →
            </Link>
          )}
          <Link
            href="/my-garden"
            className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
          >
            마이가든에 저장됨
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-plant-primary hover:text-plant-primary"
          >
            다른 사진 진단하기
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          AI 진단은 사진만으로 판단한 참고 의견이에요. 오늘{" "}
          {result.daily_limit - result.remaining_today}/{result.daily_limit}회 사용했어요.
        </p>
      </div>
    </div>
  );
}
