import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /_next/image는 색인 대상 페이지가 아니라 내부 이미지 리사이징 API라 크롤 노이즈만 발생시킴
      disallow: ["/api/", "/_next/image"],
    },
    sitemap: "https://plants.nemoneai.com/sitemap.xml",
  };
}
