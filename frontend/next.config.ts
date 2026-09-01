import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // now/matmatch와 동일하게 로컬 빌드 → tar → scp 배포 방식을 쓰기 위해 standalone 출력 필요
  output: "standalone",
  images: {
    // 농사로(농촌진흥청) API가 주는 실제 식물 사진이 이 도메인에서 옴(영구 URL, 만료 없음)
    remotePatterns: [
      { protocol: "https", hostname: "nongsaro.go.kr" },
      { protocol: "https", hostname: "www.nongsaro.go.kr" },
      // 국립수목원 API로 늘어난 자생식물 종에는 사진이 없어 Wikimedia Commons에서
      // 학명으로 검색한 CC 라이선스 사진을 다운로드 없이 핫링크로 사용(2026-08-31).
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // 매거진(맛매치 Special 연동) 썸네일 — 맛매치가 쓰는 GCS 버킷(2026-09-01)
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  // 브라우저에서 /api/*를 호출할 때(마이가든 저장 등) — 프로덕션은 nginx가 /api/를
  // 백엔드(:8082)로 먼저 보내주므로 여기까지 오지 않고, 로컬에서만 이 rewrite가 쓰인다.
  // /api/admin/*은 제외 — 그건 이 앱 자신의 라우트 핸들러(app/api/admin/*)가 처리해야
  // 관리자 인증(requireAdmin)을 거친 뒤에만 백엔드로 프록시되기 때문.
  async rewrites() {
    return [
      {
        source: "/api/:path((?!admin/).*)",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
