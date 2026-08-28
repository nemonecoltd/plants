import type { GuideSummary } from "@/lib/api";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_SECRET = process.env.PLANTS_ADMIN_SECRET;

export interface AdminGuide extends GuideSummary {
  body_md: string | null;
}

export interface GuideDraft {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  body_markdown: string;
}

// 서버 컴포넌트/라우트 핸들러 전용 — 이 파일은 절대 클라이언트 컴포넌트에서 import하면 안 됨
// (PLANTS_ADMIN_SECRET이 NEXT_PUBLIC_ 접두사가 없어 브라우저 번들엔 안 실리지만, 안전하게
// 서버 실행 경로에서만 호출하는 규칙을 지킨다).
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
      "x-plants-admin-secret": ADMIN_SECRET ?? "",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`관리자 API 실패(${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function adminListGuides(): Promise<AdminGuide[]> {
  const data = await adminFetch<{ items: AdminGuide[] }>("/api/admin/guides");
  return data.items;
}

export async function adminGetGuide(slug: string): Promise<AdminGuide> {
  return adminFetch<AdminGuide>(`/api/admin/guides/${slug}`);
}

export async function adminGenerateDraft(keywords: string): Promise<GuideDraft> {
  return adminFetch<GuideDraft>("/api/admin/guides/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords }),
  });
}

export interface GuidePublishPayload {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  body_markdown: string;
  is_hero: boolean;
}

export async function adminPublishGuide(payload: GuidePublishPayload): Promise<{ slug: string }> {
  return adminFetch<{ slug: string }>("/api/admin/guides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateGuide(slug: string, payload: GuidePublishPayload): Promise<{ slug: string }> {
  return adminFetch<{ slug: string }>(`/api/admin/guides/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteGuide(slug: string): Promise<void> {
  await adminFetch<{ ok: boolean }>(`/api/admin/guides/${slug}`, { method: "DELETE" });
}
