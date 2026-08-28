import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // now/matmatch와 동일하게 로컬 빌드 → tar → scp 배포 방식을 쓰기 위해 standalone 출력 필요
  output: "standalone",
  images: {
    // 농사로(농촌진흥청) API가 주는 실제 식물 사진이 이 도메인에서 옴(영구 URL, 만료 없음)
    remotePatterns: [
      { protocol: "https", hostname: "nongsaro.go.kr" },
      { protocol: "https", hostname: "www.nongsaro.go.kr" },
    ],
  },
  // 브라우저에서 /api/*를 호출할 때(마이가든 저장 등) — 프로덕션은 nginx가 /api/를
  // 백엔드(:8082)로 먼저 보내주므로 여기까지 오지 않고, 로컬에서만 이 rewrite가 쓰인다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
