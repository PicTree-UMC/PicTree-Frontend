/** '2024-03-31' → '3월 31일' 형식의 날짜 라벨. */
export function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 서버 날짜 문자열을 Date 로. 파싱 실패는 null 을 준다.
 *
 * 날짜 하나 때문에 카드가 'Invalid Date' 로 깨지는 걸 막는다 — 백엔드가 값을 비워
 * 보내는 경우가 있는지 아직 확인하지 못했다(`recordDate` 는 스웨거 예시에만 있다).
 */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** '2026-04-01' → '2026년 4월 1일'. 동선 카드·바텀시트의 방문 날짜 표시용. */
export function formatRecordDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return '';

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 방문 날짜 목록 → 한 줄 라벨. 하나면 그 날짜, 여러 날이면 '처음 ~ 마지막' 범위로 줄인다.
 *
 * 서버가 `recordDate` 하나에서 **`recordDates` 배열로 바꿨다**(2026-07-31 스웨거) — 한 동선이
 * 여러 날짜를 걸칠 수 있기 때문이다. 카드는 한 줄이라 전부 나열할 수 없어 범위로 접는다.
 * 순서는 서버를 믿지 않고 여기서 정렬한다('YYYY-MM-DD' 라 사전순 = 날짜순).
 */
export function formatRecordDates(values: string[] | null | undefined) {
  const dates = [...(values ?? [])].filter(Boolean).sort();
  if (dates.length === 0) return '';
  if (dates.length === 1) return formatRecordDate(dates[0]);

  const last = parseDate(dates[dates.length - 1]);
  if (!last) return formatRecordDate(dates[0]);

  // 끝 날짜는 연도를 떼서 '2026년 3월 31일 ~ 4월 1일' 로 읽히게 한다. 해를 넘기면 붙여준다.
  const first = parseDate(dates[0]);
  const sameYear = first?.getFullYear() === last.getFullYear();
  const tail = sameYear
    ? `${last.getMonth() + 1}월 ${last.getDate()}일`
    : formatRecordDate(dates[dates.length - 1]);

  return `${formatRecordDate(dates[0])} ~ ${tail}`;
}

/** ISO 8601 → '2026.4.2'. 동선 카드 하단의 저장일 표시용. */
export function formatSavedDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return '';

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}
