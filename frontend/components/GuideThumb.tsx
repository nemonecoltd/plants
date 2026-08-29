import Image from "next/image";

// 가드닝팁 썸네일은 출처가 두 가지다.
//  1) 저장소에 커밋돼 배포 산출물에 포함된 파일 → `/images/guides/...`
//  2) 관리자가 프로덕션에서 발행할 때 서버가 만든 파일 → `/api/guides/image/...`
//
// 2번을 next/image에 넘기면 안 된다. next/image는 상대경로를 최적화할 때 Next 서버
// 자신에게 내부 요청을 보내는데, `/api/`는 next.config의 rewrite로 백엔드에 프록시되고
// 그 destination이 **빌드 시점에 문자열로 굳어버려** 프로덕션에서도 로컬 기본값
// (127.0.0.1:8000)을 가리킨다. 실제 백엔드는 8082라 ECONNREFUSED → 이미지 400.
// (브라우저의 일반 요청은 nginx가 /api/를 백엔드로 보내므로 멀쩡하다 — 그래서 이
//  잘못된 rewrite가 여태 드러나지 않았다.)
//
// 그래서 2번은 최적화를 포기하고 그대로 내보낸다. 어차피 브랜드 색으로 생성한
// 단색 PNG라 용량이 작아 최적화 이득이 크지 않다.
export default function GuideThumb({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  if (src.startsWith("/api/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  return <Image src={src} alt={alt} fill className="object-cover" priority={priority} />;
}
