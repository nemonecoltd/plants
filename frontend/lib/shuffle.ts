// 목록 페이지는 페이지네이션이 있어 매 요청마다 진짜 랜덤(Math.random)으로 섞으면
// 다음 페이지 이동 시 순서가 통째로 바뀌어 항목이 겹치거나 빠질 수 있음 — 날짜로
// 시드를 고정해 하루 동안은 같은 순서를 유지하면서도(페이지네이션 안정), 매일
// 자연스럽게 바뀌도록 함(오늘 수집한 항목이 계속 1페이지를 독점하는 문제 해결).
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function todaySeed(): number {
  return Math.floor(Date.now() / 86400000);
}
