"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.nemoneai.com";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  profileUrl: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    // onAuthStateChange는 구독 직후 현재 세션으로 한 번 발화하므로 초기 조회를 따로 하지 않아도 됨
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 자체 로그인 화면을 두지 않고 통합 인증 센터로 보냄(matmatch/PACE와 동일)
  const signIn = useCallback(() => {
    const next = window.location.href;
    window.location.href = `${AUTH_URL}/login?next=${encodeURIComponent(next)}`;
  }, []);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signOut, profileUrl: `${AUTH_URL}/profile` }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
