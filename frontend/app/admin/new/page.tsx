"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GuideForm, { type GuideFormValues } from "@/components/admin/GuideForm";
import type { GuidePublishPayload } from "@/lib/adminApi";

const EMPTY: GuideFormValues = {
  title: "",
  slug: "",
  summary: "",
  category: "가드닝 기초",
  tags: "",
  body_markdown: "",
  is_hero: false,
};

export default function NewGuidePage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GuideFormValues | null>(null);

  const generateDraft = async () => {
    if (!keywords.trim()) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/guides/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        category: data.category,
        tags: (data.tags as string[]).join(", "),
        body_markdown: data.body_markdown,
        is_hero: false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const publish = async (payload: GuidePublishPayload) => {
    const res = await fetch("/api/admin/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    router.push("/admin");
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-lg font-bold text-plant-primary mb-6">새 콘텐츠 생성</h1>

      {!draft ? (
        <div className="flex flex-col gap-3">
          <label className="block text-xs font-bold text-gray-500">
            어떤 글을 쓸지 키워드/요청사항을 입력하세요
          </label>
          <textarea
            className="w-full px-3 py-2 text-sm rounded border border-gray-200 outline-none focus:border-plant-primary"
            rows={4}
            placeholder="예: 다육식물 여름철 관리, 웃자람 방지 방법"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={generateDraft}
            disabled={generating || !keywords.trim()}
            className="self-start px-6 py-2.5 rounded-full bg-plant-primary text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {generating ? "AI가 초안을 쓰는 중..." : "AI로 초안 생성"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            AI 초안이 생성되었습니다. 검토·수정 후 발행해주세요.
          </p>
          <GuideForm initial={draft} submitLabel="발행" onSubmit={publish} />
        </>
      )}
    </main>
  );
}
