import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 브라우저 클라이언트(lib/supabase/client.ts)와 동일한 프로젝트/쿠키 도메인을 써서
// auth.nemoneai.com에서 로그인한 세션을 서버 컴포넌트/라우트 핸들러에서도 읽는다.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: ".nemoneai.com",
        secure: true,
        sameSite: "lax",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없음(읽기 전용) — 세션 갱신은
          // 미들웨어가 없는 이 앱 구조상 필요 없음(마이가든도 클라이언트에서만 갱신).
        },
      },
    }
  );
}
