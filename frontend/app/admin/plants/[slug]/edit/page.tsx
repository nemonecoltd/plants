import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { adminGetPlant } from "@/lib/adminApi";
import EditPlantForm from "./EditPlantForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditPlantPage({ params }: Props) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const { slug } = await params;
  const plant = await adminGetPlant(slug);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-plant-primary">{plant.name_kr} 편집</h1>
        <Link
          href="/admin/plants"
          className="inline-block px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium no-underline hover:border-plant-primary hover:text-plant-primary transition-colors"
        >
          ← 목록
        </Link>
      </div>
      <EditPlantForm plant={plant} />
    </main>
  );
}
