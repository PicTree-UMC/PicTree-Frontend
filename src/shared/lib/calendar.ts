/**
 * 한 달을 주 단위로 자른 표. 빈 칸은 `null`.
 *
 * `weekStartsOn` 은 첫 열의 요일(0=일, 1=월). **기본은 월요일** — 프로필 여행 달력과
 * 블로그 기간 선택이 그렇게 그려져 있어서 기본값을 바꾸면 두 화면이 조용히 어긋난다.
 */
export function buildCalendarWeeks(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 1,
): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const leadingCells = (firstWeekday - weekStartsOn + 7) % 7;
  const dayCount = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  for (let index = 0; index < leadingCells; index += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

export function toCalendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
