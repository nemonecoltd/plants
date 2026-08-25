import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // now/matmatch와 동일하게 로컬 빌드 → tar → scp 배포 방식을 쓰기 위해 standalone 출력 필요
  output: "standalone",
};

export default nextConfig;
