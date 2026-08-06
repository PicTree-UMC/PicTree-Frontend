export function formatShortDate(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return `${month}월 ${day}일`;
}

export function formatLongDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function formatDateRange(startDate: string, endDate: string, long = false) {
  const formatter = long ? formatLongDate : formatShortDate;
  if (startDate === endDate) return formatter(startDate);
  return `${formatter(startDate)} ~ ${formatter(endDate)}`;
}
