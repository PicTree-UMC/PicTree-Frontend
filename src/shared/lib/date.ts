/** UTC가 아닌 기기의 현지 날짜를 YYYY-MM-DD 형식으로 반환. */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ISO 8601 문자열을 "2026년 4월 29일" 형식으로. 구독 결제일·만료일 표시에 쓴다. */
export function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
