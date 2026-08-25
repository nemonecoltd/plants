import type { MetadataRoute } from "next";
import { getPlants } from "@/lib/api";

const SITE_URL = "https://plants.nemoneai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const plants = await getPlants();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...plants.map((p) => ({
      url: `${SITE_URL}/plants/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
