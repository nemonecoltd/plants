"use client";

import { useRouter } from "next/navigation";
import GuideForm from "@/components/admin/GuideForm";
import type { AdminGuide, GuidePublishPayload } from "@/lib/adminApi";

export default function EditGuideForm({ guide }: { guide: AdminGuide }) {
  const router = useRouter();

  const save = async (payload: GuidePublishPayload) => {
    const res = await fetch(`/api/admin/guides/${guide.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    router.push("/admin");
  };

  return (
    <GuideForm
      initial={{
        title: guide.title,
        slug: guide.slug,
        summary: guide.summary ?? "",
        category: guide.category ?? "가드닝 기초",
        tags: guide.tags.join(", "),
        body_markdown: guide.body_md ?? `# ${guide.title}\n\n`,
        is_hero: guide.is_hero,
      }}
      submitLabel="저장"
      onSubmit={save}
    />
  );
}
