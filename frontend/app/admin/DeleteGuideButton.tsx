"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGuideButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${title}"을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/guides/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e) {
      alert(`삭제 실패: ${e instanceof Error ? e.message : e}`);
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
