"use client";

import { useState } from "react";
import Image from "next/image";

// 식물 이미지의 72%가 위키미디어 핫링크(Wikimedia)인데, 위키미디어가 간헐적으로 429(요청
// 과다)를 반환해도 여태 onError 처리가 없어서 깨진 이미지 아이콘이 그대로 노출됐음(2026-09,
// 플레이스토어 리뷰에서 "응답하지 않는 UI" 신고 계기로 발견). 로드 실패 시 "이미지 준비 중"
// 폴백으로 전환 — 이미지가 아예 없는 경우와 같은 화면으로 보이게 해 사용자에게 깨진 느낌을
// 안 주는 게 목표.
export default function PlantImage({
  src,
  alt,
  className,
  priority,
  fallbackClassName = "w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackClassName?: string;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={fallbackClassName}>이미지 준비 중</div>;
  }

  return (
    <>
      <Image src={src} alt={alt} fill className={className} priority={priority} onError={() => setFailed(true)} />
      {children}
    </>
  );
}
