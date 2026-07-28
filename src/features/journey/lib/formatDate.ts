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

/** ISO 8601 → '2026.4.2'. 동선 카드 하단의 저장일 표시용. */
export function formatSavedDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return '';

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}
