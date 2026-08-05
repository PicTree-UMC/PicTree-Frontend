/** UTC가 아닌 기기의 현지 날짜를 YYYY-MM-DD 형식으로 반환. */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO 8601 문자열을 "2026년 4월 29일" 형식으로. 구독 결제일·만료일 표시에 쓴다.
 *
 * ⚠️ **값이 없거나 잘못됐으면 `null` 을 준다.** 예전에는 그대로 `new Date()` 에
 * 넘겼는데, `new Date(null)` 은 Unix epoch 라 화면에 **"1970년 1월 1일 만료"** 가
 * 떴다. 서버가 `expiresAt` 을 null 로 주는 경우(해지 직후 등)에 실제로 그랬다.
 *
 * 호출부가 `null` 을 받아 "-" 든 다른 문구든 스스로 정하게 한다 — 없는 날짜를
 * 그럴듯한 날짜로 보여주는 것보다 낫다.
 */
export function formatKoreanDate(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
