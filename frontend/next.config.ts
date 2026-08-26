import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // now/matmatch와 동일하게 로컬 빌드 → tar → scp 배포 방식을 쓰기 위해 standalone 출력 필요
  output: "standalone",
  images: {
    // 농사로(농촌진흥청) API가 주는 실제 식물 사진이 이 도메인에서 옴(영구 URL, 만료 없음)
    remotePatterns: [{ protocol: "https", hostname: "nongsaro.go.kr" }],
  },
};

export default nextConfig;
