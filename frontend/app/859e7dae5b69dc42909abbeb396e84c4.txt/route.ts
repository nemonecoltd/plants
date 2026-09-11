// IndexNow 키 소유 증명 파일(2026-09-11) — plants/backend의 indexnow_service.py가 이 키로
// 핑을 보내고, Bing 등이 https://plants.nemoneai.com/{key}.txt에서 같은 값을 확인해 소유를
// 검증한다. 키 값을 바꾸면 이 파일명과 백엔드의 INDEXNOW_KEY를 반드시 같이 바꿀 것.
export async function GET() {
  return new Response("859e7dae5b69dc42909abbeb396e84c4", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
