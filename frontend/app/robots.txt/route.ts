// robots.txt — 다음 웹마스터도구 소유 확인 주석을 넣으려고 robots.ts(MetadataRoute, 주석 불가)를 텍스트 라우트로 바꿨다(2026-11-16).
// 규칙은 이전 robots.ts와 동일.
// - 관리자가 발행한 글의 썸네일은 백엔드가 /api/ 아래로 서빙하는데(Next standalone이 런타임 생성 파일을 못 서빙해서),
//   이 이미지가 곧 글의 OG·트위터 카드·JSON-LD 이미지라 크롤러가 못 가져가면 공유 미리보기가 깨진다.
//   /api/ 전면 차단보다 우선하도록 더 긴 경로로 명시 허용(구글은 최장 일치 규칙을 따름).
// - /api/diagnoses/image/는 사용자가 올린 개인 사진이라 /api/ 차단에 그대로 남겨둔다.
// - /_next/image 차단은 해제 상태 유지(가이드 썸네일 등 실제 콘텐츠 이미지가 전부 이 경로로 나간다, 2026-09-04).
const DAUM_VERIFY = "#DaumWebMasterTool:09bcd74d578414e606eb4900139679902026037342fe3bf3be05cccb68813dec:CNSJIIGOISrSV2aL3hPlgQ==";

export function GET() {
  const body = [
    DAUM_VERIFY,
    "User-Agent: *",
    "Allow: /",
    "Allow: /api/guides/image/",
    "Disallow: /api/",
    "",
    "Sitemap: https://plants.nemoneai.com/sitemap.xml",
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
