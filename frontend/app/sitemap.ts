import type { MetadataRoute } from "next";
import { getGuides, getPlants } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plants, guides] = await Promise.all([getPlants(), getGuides()]);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
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
      lastModified: g.published_at ? new Date(g.published_at) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
