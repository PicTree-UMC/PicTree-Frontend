/** 화면설계서 0번: 한 번에 고를 수 있는 날짜는 3일, 저장할 수 있는 장소는 20개까지. */
export const MAX_DATES = 3;
export const MAX_PLACES = 20;

/** 고른 날짜를 실어 나르는 쿼리 파라미터 이름(`/journey/view?dates=2026-03-31,2026-04-01`). */
export const DATES_PARAM = 'dates';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `?dates=` → 날짜 배열.
 *
 * **navigate state 가 아니라 URL 로 나른다** — 날짜 고르기와 지도가 두 화면으로 갈리면서
 * 뒤로가기·새로고침·딥링크가 전부 이 값을 되살릴 수 있어야 하기 때문이다. 손으로 친 주소가
 * 들어올 수 있으므로 형식·중복·개수를 여기서 전부 막는다(지도 쪽에서 다시 검사하지 않게).
 */
export function parseDatesParam(value: string | null): string[] {
  if (!value) return [];

  const dates = value.split(',').filter((date) => DATE_KEY.test(date));
  // 지도·하단바의 순번이 날짜 순서를 따라가도록 항상 오름차순으로 유지한다.
  return [...new Set(dates)].sort().slice(0, MAX_DATES);
}

/** 날짜 배열 → `?dates=` 값. */
export function toDatesParam(dates: string[]) {
  return dates.join(',');
}
