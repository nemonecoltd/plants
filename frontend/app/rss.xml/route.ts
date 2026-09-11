// 네이버 서치어드바이저 RSS 제출용 피드.
// 네이버는 콘텐츠 사이트 신규 글 자동 발견에 sitemap보다 RSS를 우선 폴링한다(matmatch에서
// 실측 확인·해결한 패턴, 2026-08-07 SEO 대응 히스토리 문서 참고) — Plants도 사이트맵 2,106건
// 대비 네이버 색인 5건뿐이라 같은 원인(RSS 부재)으로 보고 동일하게 신설(2026-09-04).
import { NextResponse } from "next/server";
import { getGuides } from "@/lib/api";

export const revalidate = 1800; // 30분마다 재생성 — 발행 후 네이버가 빠르게 발견하도록

const BASE = "https://plants.nemoneai.com";

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  let guides: Awaited<ReturnType<typeof getGuides>> = [];
  try {
    guides = await getGuides();
  } catch (e) {
    console.error("RSS fetch error:", e);
  }

  guides = guides
    .filter((g) => g.published_at)
    .sort((a, b) => new Date(b.published_at as string).getTime() - new Date(a.published_at as string).getTime())
    .slice(0, 50);

  const lastBuild = guides[0]?.published_at ? new Date(guides[0].published_at as string).toUTCString() : new Date().toUTCString();

  const items = guides
    .map((g) => {
      const url = `${BASE}/guide/${g.slug}`;
      const pubDate = new Date(g.published_at as string).toUTCString();
      return `    <item>
      <title>${esc(g.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${g.category ? `<category>${esc(g.category)}</category>` : ""}
      <description>${esc(g.summary || g.title)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>NEMONE PLANTS</title>
    <link>${BASE}</link>
    <description>${esc("AI 식물 진단 & 식물집사 케어 가이드")}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
