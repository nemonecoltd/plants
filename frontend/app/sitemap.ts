import type { MetadataRoute } from "next";
import { getGuideTags, getGuides, getPlants } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plants, guides, tags] = await Promise.all([getPlants(), getGuides(), getGuideTags()]);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      // AI 진단 — 서비스 차별점이자 증상형 검색어의 착지 페이지라 도감과 같은 비중으로 둔다
      url: `${SITE_URL}/diagnose`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // 진단 모아보기 1페이지 — 개별 진단(/diagnose/[id])은 noindex라 이 목록이
      // 진단 콘텐츠 중 실제로 색인되는 유일한 페이지. 뒤 페이지는 콘텐츠가 계속
      // 바뀌는 데다 얕은 페이지가 늘어나는 걸 피하려 sitemap엔 1페이지만 둔다.
      url: `${SITE_URL}/diagnose/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/plants`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...plants.map((p) => ({
      url: `${SITE_URL}/plants/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...guides.map((g) => ({
      url: `${SITE_URL}/guide/${g.slug}`,
      // 관리자가 발행 후에도 내용을 수정할 수 있게 됐으니(2026-08-29 /admin 추가),
      // 고정된 published_at 대신 updated_at을 우선해 실제 갱신 시점을 신호로 준다
      lastModified: g.updated_at ? new Date(g.updated_at) : g.published_at ? new Date(g.published_at) : undefined,
      // 자체 글은 계절 정보를 갱신할 여지가 있어 수집분보다 자주 확인하도록 둠
      changeFrequency: g.source === "original" ? ("monthly" as const) : ("yearly" as const),
      priority: g.source === "original" ? 0.7 : 0.6,
    })),
    // 태그 페이지 — 롱테일 키워드마다 색인 대상이 하나씩 생기고, 관련 글을 서로 묶어준다
    ...tags.map((t) => ({
      url: `${SITE_URL}/guide/tag/${encodeURIComponent(t.tag)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
