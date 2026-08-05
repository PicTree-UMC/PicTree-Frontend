/**
 * 한 달을 주 단위로 자른 표. 빈 칸은 `null`.
 *
 * **첫 열은 항상 일요일이다.** 예전에는 `weekStartsOn` 인자로 화면마다 골랐는데, 프로필
 * 여행 달력·블로그 기간 선택은 월요일, 동선 날짜 고르기는 일요일로 갈려 있었다. 같은 앱
 * 안에서 달력의 열 배치가 화면마다 다르면 날짜를 잘못 짚는다(#104).
 */
export function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const dayCount = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  for (let index = 0; index < firstWeekday; index += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

export function toCalendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
