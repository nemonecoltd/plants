"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Kind = "plant" | "guide";

type SavedContextValue = {
  isSaved: (kind: Kind, slug: string) => boolean;
  toggle: (kind: Kind, slug: string) => Promise<void>;
  ready: boolean;
};

const SavedContext = createContext<SavedContextValue | undefined>(undefined);

// 저장 목록을 카드마다 각각 조회하면 목록 페이지에서 수십 번 요청이 나가므로,
// 로그인 시 슬러그 목록만 한 번 받아 전역으로 들고 있는다.
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Set<string>>(new Set());
  const [guides, setGuides] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setPlants(new Set());
      setGuides(new Set());
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/me/saved-slugs?user_id=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setPlants(new Set<string>(data.plants ?? []));
        setGuides(new Set<string>(data.guides ?? []));
        setReady(true);
      } catch {
        // 저장 목록을 못 불러와도 페이지 자체는 정상 동작해야 하므로 조용히 무시
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const isSaved = useCallback(
    (kind: Kind, slug: string) => (kind === "plant" ? plants : guides).has(slug),
    [plants, guides]
  );

  const toggle = useCallback(
    async (kind: Kind, slug: string) => {
      if (!user) return;
      const setter = kind === "plant" ? setPlants : setGuides;
      const current = kind === "plant" ? plants : guides;
      const willSave = !current.has(slug);

      // 낙관적 업데이트 — 네트워크 왕복을 기다리면 하트가 굼떠 보임
      setter((prev) => {
        const next = new Set(prev);
        if (willSave) next.add(slug);
        else next.delete(slug);
        return next;
      });

      try {
        const endpoint = kind === "plant" ? "saved-plants" : "saved-guides";
        const res = await fetch(`/api/me/${endpoint}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, slug }),
        });
        if (!res.ok) throw new Error("toggle failed");
        const data = await res.json();
        // 서버가 판단한 최종 상태로 정렬(중복 클릭 등으로 어긋났을 때 보정)
        setter((prev) => {
          const next = new Set(prev);
          if (data.saved) next.add(slug);
          else next.delete(slug);
          return next;
        });
      } catch {
        setter((prev) => {
          const next = new Set(prev);
          if (willSave) next.delete(slug);
          else next.add(slug);
          return next;
        });
      }
    },
    [user, plants, guides]
  );

  return (
    <SavedContext.Provider value={{ isSaved, toggle, ready }}>{children}</SavedContext.Provider>
  );
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
