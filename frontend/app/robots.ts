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
      // /_next/image 차단은 "페이지가 아니니 크롤 노이즈"라는 취지였는데, 실제로는 가이드
      // 썸네일 등 실제 콘텐츠 이미지가 전부 이 경로로 리사이징돼 나가고 있어서 이미지 검색
      // 노출 자체가 막혀버리고, 네이버 서치어드바이저에도 "차단된 페이지"로 잡혀 카운트만
      // 부풀렸음(2026-09-04, 실사용자 신고로 확인) — 차단 해제.
      disallow: ["/api/"],
    },
    sitemap: "https://plants.nemoneai.com/sitemap.xml",
  };
}
