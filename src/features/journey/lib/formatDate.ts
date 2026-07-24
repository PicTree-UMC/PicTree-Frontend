/** '2024-03-31' → '3월 31일' 형식의 날짜 라벨. */
export function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
