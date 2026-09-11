// GEO(생성엔진 최적화) — ChatGPT/Perplexity/Claude 등에게 주는 사이트 안내서(2026-09-11).
// now(PACE)에 먼저 적용한 것과 동일한 패턴 — 정적 파일이 아니라 라우트로 서빙.
// 참고: https://github.com/leopard627/fire-your-seo-agency (references/geo.md)
export const revalidate = 86400; // 하루 1회 재생성

const BASE_URL = "https://plants.nemoneai.com";

export async function GET() {
  const body = `# NEMONE PLANTS

> 사진 한 장으로 식물 상태를 진단하고, 물주기·빛·내한성 등 케어 정보를 찾아보는 식물도감·AI
> 진단 서비스입니다. 진단 기록은 마이가든에 저장됩니다.

## 핵심 페이지
- [AI 식물 진단](${BASE_URL}/diagnose): 사진 업로드로 식물 상태·질병 진단
- [식물도감](${BASE_URL}/plants): 물주기·빛·난이도·내한성 등 케어 정보
- [가드닝 가이드](${BASE_URL}/guide): 식물별 관리법 아티클
- [마이가든](${BASE_URL}/my-garden): 내 진단 기록·저장한 식물

## 데이터 정책
- 식물도감 데이터: 농사로(농촌진흥청)·국립수목원 국가생물종지식정보시스템 등 공공 데이터 기반
- AI 진단: 업로드된 사진을 AI가 분석해 식물 종류·상태·관리법을 제안 (참고용, 확진 아님)
- 인용 시 표기: NEMONE PLANTS (plants.nemoneai.com)

## 계열 서비스
- [네모네AIM](https://nemoneai.com): 미식·문화·라이프·기술 매거진
- [NEMONE PACE](https://now.nemoneai.com): 서울·부산·제주 팝업스토어 실시간 랭킹
- [NEMONE MSM](https://msm.nemoneai.com): 국내 주식 AI 분석
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
