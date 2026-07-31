export interface CalendarMonth {
  year: number;
  month: number; // 1-12
  blanks: number; // 1일 앞의 빈 칸 수(월요일 시작 기준)
  days: number[]; // 1 ~ 말일
}

/** 시안의 요일 머리글. 월요일 시작이다(일요일 시작 아님). */
export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

/** 'YYYY-MM-DD'. 서버 날짜 문자열과 같은 형식이라 그대로 키로 쓴다. */
export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 'YYYY-MM-DD' → 로컬 자정 Date.
 * `new Date('2026-04-29')` 는 UTC 자정으로 읽혀서 시간대에 따라 하루가 밀린다.
 */
export function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** from 이 속한 달부터 to 가 속한 달까지, 오름차순 월 목록. */
export function buildMonthRange(from: Date, to: Date): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const last = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const dayCount = new Date(year, month, 0).getDate(); // 다음 달 0일 = 이번 달 말일

    months.push({
      year,
      month,
      blanks: (new Date(year, month - 1, 1).getDay() + 6) % 7, // 일=0 을 월=0 으로 회전
      days: Array.from({ length: dayCount }, (_, index) => index + 1),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}
