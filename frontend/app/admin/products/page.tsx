import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { adminListAffiliateProducts } from "@/lib/adminApi";
import DeleteProductButton from "./DeleteProductButton";
import NewProductForm from "./NewProductForm";

export default async function AdminProductsPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const products = await adminListAffiliateProducts();

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-plant-primary">쿠팡 파트너스 상품 ({products.length})</h1>
        <Link href="/admin" className="text-xs text-plant-secondary hover:text-plant-primary no-underline">
          ← 콘텐츠 목록
        </Link>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-plant-primary truncate">{p.label}</div>
              <div className="text-[11px] text-gray-400 truncate">{p.match_keywords.join(", ")}</div>
            </div>
            <DeleteProductButton id={p.id} label={p.label} />
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-sm font-bold text-plant-primary mb-3">새 상품 추가</h2>
        <NewProductForm />
      </div>
    </main>
  );
}
