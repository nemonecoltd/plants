import type { AffiliateProduct } from "@/lib/api";

// 태그 체계가 완전히 정형화돼 있지 않아(예: "화분관리" vs "화분 관리") 정확한
// 일치 대신 부분일치 점수로 가장 관련 있는 상품 1~2개를 고른다.
export function matchProducts(
  products: AffiliateProduct[],
  haystack: string,
  limit = 2
): AffiliateProduct[] {
  const normalized = haystack.toLowerCase();
  const scored = products
    .map((p) => ({
      product: p,
      score: p.match_keywords.filter((k) => normalized.includes(k.toLowerCase())).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
}

export default function ProductRecommendation({ products }: { products: AffiliateProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-[11px] font-bold text-gray-400 tracking-wider mb-3">🛒 관련 용품 추천</div>
      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <a
            key={p.id}
            href={p.coupang_url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-plant-secondary/10 text-plant-primary text-sm font-medium no-underline hover:bg-plant-secondary/20 transition-colors"
          >
            <span>{p.label} 보러가기</span>
            <span aria-hidden>→</span>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
        이 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}
