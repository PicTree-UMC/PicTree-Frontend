import { formatKoreanDate, formatKoreanMonthDay } from '@/shared/lib/date';

/*
  한국어 날짜 표기는 `shared/lib/date` 가 갖는다(이슈 #294). 여기 남은 것은 **블로그의
  사정** — 시작·끝 날짜를 한 줄 범위로 접는 규칙이다.

  ⚠️ 종전 구현은 문자열을 직접 쪼갰고(`date.split('-')`), 네 벌 중 **유일하게 시간대에
  안 밀리는** 방식이었다. 옮겨 간 공용 함수가 날짜만 있는 값에 대해 같은 방식을 쓰므로
  표기는 그대로다 — 여기가 기준이 된 셈이다.
*/

/** 못 읽는 값은 원본을 그대로 보여 준다. 지어낸 날짜보다 낫고, 무엇이 잘못됐는지도 보인다. */
export function formatShortDate(date: string) {
  return formatKoreanMonthDay(date) ?? date;
}

export function formatLongDate(date: string) {
  return formatKoreanDate(date) ?? date;
}

export function formatDateRange(startDate: string, endDate: string, long = false) {
  const formatter = long ? formatLongDate : formatShortDate;
  if (startDate === endDate) return formatter(startDate);
  return `${formatter(startDate)} ~ ${formatter(endDate)}`;
}
