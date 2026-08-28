import { createBrowserClient } from "@supabase/ssr";

// 쿠키 도메인을 .nemoneai.com으로 맞춰야 auth.nemoneai.com에서 로그인한 세션이
// plants.nemoneai.com에서도 인식됨(matmatch/PACE/auth 전부 동일 설정).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: ".nemoneai.com",
        secure: true,
        sameSite: "lax",
      },
    }
  );
}
