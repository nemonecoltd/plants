import AdBanner from "@/components/AdBanner";
import ProductRecommendation, { matchProducts } from "@/components/ProductRecommendation";
import { getAffiliateProducts } from "@/lib/api";

// 모든 페이지 하단에 "관련 용품 + 광고"를 같은 모양으로 붙이기 위한 공용 블록.
// 페이지마다 따로 조립하면 어디는 빠지고 어디는 순서가 다른 식으로 어긋나서 한 곳에 모음.
//
// haystack: 글 제목·태그처럼 매칭에 쓸 텍스트. 목록 페이지처럼 문맥이 없는 곳은
// 넘기지 않으면 되고, 그때는 매칭 대신 정렬 순서 상위 상품을 기본으로 보여준다
// ("맞는 게 없으면 안 보여준다"는 상세페이지 원칙과 달리, 목록에서는 애초에 매칭할
//  문맥 자체가 없어 비워두면 그냥 광고만 남기 때문).
export default async function PageFooterPromo({
  haystack,
  fallbackCount = 2,
}: {
  haystack?: string;
  fallbackCount?: number;
}) {
  const products = await getAffiliateProducts();
  const matched = haystack ? matchProducts(products, haystack) : [];
  const shown = matched.length > 0 ? matched : products.slice(0, fallbackCount);

  return (
    <div className="flex flex-col gap-4">
      {shown.length > 0 && <ProductRecommendation products={shown} />}
      <AdBanner dataAdSlot="6819394440" />
    </div>
  );
}
