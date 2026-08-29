"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProductForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full px-3 py-2 text-sm rounded border border-gray-200 outline-none focus:border-plant-primary";

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/affiliate-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          coupang_url: url,
          image_url: imageUrl || null,
          match_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          sort_order: 99,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLabel("");
      setUrl("");
      setImageUrl("");
      setKeywords("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">상품명(표시용)</label>
        <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 원예용 전정가위" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">쿠팡 파트너스 링크</label>
        <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://link.coupang.com/a/..." />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">상품 이미지 URL(선택)</label>
        <input
          className={inputClass}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://... (쿠팡 상품 페이지에서 이미지 주소 복사)"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">매칭 키워드(콤마로 구분)</label>
        <input
          className={inputClass}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="예: 가지치기, 전정"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !label || !url}
        className="self-start px-6 py-2.5 rounded-full bg-plant-primary text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {submitting ? "추가 중..." : "추가"}
      </button>
    </div>
  );
}
