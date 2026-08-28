import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "nemonecoltd@gmail.com";

// 관리자 한 명뿐이라 role 테이블 없이 이메일 화이트리스트로 충분함.
// 서버 컴포넌트/라우트 핸들러 양쪽에서 재사용(둘 다 쿠키 기반 세션을 읽을 수 있음).
export async function requireAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}
