"use client";

import { useState } from "react";
import type { GuidePublishPayload } from "@/lib/adminApi";

export interface GuideFormValues {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string;
  body_markdown: string;
  is_hero: boolean;
}

export default function GuideForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: GuideFormValues;
  submitLabel: string;
  onSubmit: (payload: GuidePublishPayload) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GuideFormValues>(key: K, v: GuideFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        category: values.category,
        tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body_markdown: values.body_markdown,
        is_hero: values.is_hero,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded border border-gray-200 outline-none focus:border-plant-primary";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">제목</label>
        <input className={inputClass} value={values.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">슬러그(URL)</label>
        <input className={inputClass} value={values.slug} onChange={(e) => set("slug", e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">요약</label>
        <input className={inputClass} value={values.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
          <input className={inputClass} value={values.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">태그(콤마로 구분)</label>
          <input className={inputClass} value={values.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">
          본문(마크다운, <code>#</code> 제목으로 시작)
        </label>
        <textarea
          className={`${inputClass} font-mono`}
          rows={20}
          value={values.body_markdown}
          onChange={(e) => set("body_markdown", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-plant-primary font-medium">
        <input
          type="checkbox"
          checked={values.is_hero}
          onChange={(e) => set("is_hero", e.target.checked)}
        />
        메인 고정(홈 히어로 1번)
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !values.title || !values.body_markdown}
        className="self-start px-6 py-2.5 rounded-full bg-plant-primary text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {submitting ? "처리 중..." : submitLabel}
      </button>
    </div>
  );
}
