import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // 관리자가 발행한 글의 썸네일은 백엔드가 /api/ 아래로 서빙하는데(Next standalone이
      // 런타임 생성 파일을 못 서빙해서), 이 이미지가 곧 글의 OG·트위터 카드·JSON-LD
      // 이미지라 크롤러가 못 가져가면 공유 미리보기가 깨진다. /api/ 전면 차단보다
      // 우선하도록 더 긴 경로로 명시 허용(구글은 최장 일치 규칙을 따름).
      allow: ["/", "/api/guides/image/"],
      // /api/diagnoses/image/는 사용자가 올린 개인 사진이라 /api/ 차단에 그대로 남겨둔다.
      // /_next/image는 색인 대상 페이지가 아니라 내부 이미지 리사이징 API라 크롤 노이즈만 발생시킴
      disallow: ["/api/", "/_next/image"],
    },
    sitemap: "https://plants.nemoneai.com/sitemap.xml",
  };
}
