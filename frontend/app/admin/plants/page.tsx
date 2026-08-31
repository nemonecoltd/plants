import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { adminSearchPlants } from "@/lib/adminApi";
import DeletePlantButton from "./DeletePlantButton";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminPlantSearchPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const { q = "" } = await searchParams;
  const plants = await adminSearchPlants(q);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-plant-primary">식물도감 관리</h1>
        <Link
          href="/admin"
          className="inline-block px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium no-underline hover:border-plant-primary hover:text-plant-primary transition-colors"
        >
          ← 콘텐츠 관리
        </Link>
      </div>

      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="국명·영문명·학명으로 검색 (비워두면 최근 50건)"
          className="w-full px-4 py-2.5 text-sm rounded-full border border-gray-200 outline-none focus:border-plant-primary"
        />
      </form>

      {plants.length === 0 ? (
        <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {plants.map((p) => (
            <div
              key={p.slug}
              className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-plant-primary truncate">{p.name_kr}</div>
                <div className="text-[11px] text-gray-400 mt-0.5 italic truncate">
                  {p.scientific_name} {p.family ? `· ${p.family}` : ""} {p.source ? `· ${p.source}` : ""}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/plants/${p.slug}/edit`}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 no-underline hover:border-plant-primary hover:text-plant-primary"
                >
                  편집
                </Link>
                <DeletePlantButton slug={p.slug} name={p.name_kr} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
