/** 'YYYY-MM-DD'. 서버 날짜 문자열과 같은 형식이라 그대로 키로 쓴다. */
export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
