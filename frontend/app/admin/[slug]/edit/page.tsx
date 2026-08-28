import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { adminGetGuide } from "@/lib/adminApi";
import EditGuideForm from "./EditGuideForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditGuidePage({ params }: Props) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const { slug } = await params;
  let guide;
  try {
    guide = await adminGetGuide(slug);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-lg font-bold text-plant-primary mb-6">콘텐츠 편집</h1>
      {!guide.body_md ? (
        <p className="text-xs text-amber-600 mb-4 bg-amber-50 rounded p-3">
          이 글은 마크다운 원본이 없어 본문을 비워둔 채로 보여줍니다. 저장하면 지금 입력한
          내용이 새 원본이 됩니다.
        </p>
      ) : null}
      <EditGuideForm guide={guide} />
    </main>
  );
}
