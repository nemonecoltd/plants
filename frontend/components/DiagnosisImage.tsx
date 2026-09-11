"use client";

import { useState } from "react";

// 2026-09-11 사고 대응 — 배포 스크립트가 런타임 생성물 디렉토리(public/images/diagnoses/)를
// 통째로 지워 기존 진단 사진이 전부 깨진 이미지로 보이게 됐다(원본 파일은 백업이 없어 복구 불가,
// DB의 진단 텍스트는 그대로 살아있음). 사진이 없다고 카드/상세 전체를 숨기면 진단 기록 자체가
// 안 보이니, 이미지 로드 실패 시에만 자리표시자로 대체해 최소한 텍스트 콘텐츠는 정상 노출한다.
export default function DiagnosisImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-plant-secondary/10 text-plant-secondary/50 text-[11px]`}>
        사진이 없어요
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
  );
}
