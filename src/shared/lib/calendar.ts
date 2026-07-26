export function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const leadingCells = (firstWeekday + 6) % 7;
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
