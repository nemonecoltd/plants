import Image from "next/image";
import Link from "next/link";
import type { MagazineSummary } from "@/lib/api";

export default function MagazineCard({ post }: { post: MagazineSummary }) {
  return (
    <Link
      href={`/guide/magazine/${post.id}`}
      className="relative block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-plant-primary hover:shadow-md transition-all no-underline"
    >
      {/* 썸네일 원본 비율이 글마다 제각각이라 object-cover면 콘텐츠가 잘려나가는 문제가
          상세페이지와 동일하게 있음(2026-09-18) — object-contain으로 통일 */}
      <div className="relative aspect-[4/3] bg-plant-secondary/10">
        {post.image_url ? (
          <Image src={post.image_url} alt={post.title} fill className="object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-plant-secondary/40 text-[11px]">
            이미지 준비 중
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-[11px] text-plant-secondary mb-1">매거진</div>
        <div className="font-bold text-plant-primary text-sm leading-snug line-clamp-2">{post.title}</div>
      </div>
    </Link>
  );
}
