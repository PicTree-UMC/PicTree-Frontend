import { formatKoreanDate, formatKoreanMonthDay } from '@/shared/lib/date';

/*
  한국어 날짜 표기 자체는 `shared/lib/date` 가 갖는다(이슈 #294). 여기 남은 것은 **동선
  화면의 사정**뿐이다 — 못 읽는 날짜를 빈 칸으로 둘지, 여러 날짜를 어떻게 한 줄로 접을지.

  ⚠️ 옮기면서 하루 밀리던 문제가 같이 사라졌다. 종전 구현은 `new Date('2026-04-01')` 로
  읽었는데 그건 UTC 자정이라, 기기가 UTC 보다 뒤인 지역에 있으면 3월 31일로 찍혔다
  (`shared/lib/date` 의 `toDateParts` 주석에 실측 표가 있다). 여행 앱이라 남 얘기가 아니다.
*/

/**
 * '2024-03-31' → '3월 31일' 형식의 날짜 라벨.
 *
 * 못 읽는 값은 빈 문자열이다 — 날짜 칩에 'NaN월 NaN일' 이 뜨느니 칩이 비는 편이 낫다.
 */
export function formatDateLabel(dateStr: string) {
  return formatKoreanMonthDay(dateStr) ?? '';
}

/**
 * '2026-04-01' → '2026년 4월 1일'. 동선 카드·바텀시트의 방문 날짜 표시용.
 *
 * 날짜 하나 때문에 카드가 'Invalid Date' 로 깨지는 걸 막는다 — 백엔드가 값을 비워
 * 보내는 경우가 있는지 아직 확인하지 못했다(`recordDate` 는 스웨거 예시에만 있다).
 */
export function formatRecordDate(value: string | null | undefined) {
  return formatKoreanDate(value) ?? '';
}

/**
 * 방문 날짜 목록 → 한 줄 라벨. 하나면 그 날짜, 여러 날이면 '처음 ~ 마지막' 범위로 줄인다.
 *
 * 서버가 `recordDate` 하나에서 **`recordDates` 배열로 바꿨다**(2026-07-31 스웨거) — 한 동선이
 * 여러 날짜를 걸칠 수 있기 때문이다. 카드는 한 줄이라 전부 나열할 수 없어 범위로 접는다.
 * 순서는 서버를 믿지 않고 여기서 정렬한다('YYYY-MM-DD' 라 사전순 = 날짜순).
 */
export function formatRecordDates(values: string[] | null | undefined) {
  const dates = [...(values ?? [])].filter(Boolean).sort();
  if (dates.length === 0) return '';

  const first = dates[0];
  const last = dates[dates.length - 1];
  const firstLabel = formatRecordDate(first);

  if (dates.length === 1 || !formatKoreanDate(last)) return firstLabel;

  /*
    끝 날짜는 연도를 떼서 '2026년 3월 31일 ~ 4월 1일' 로 읽히게 한다. 해를 넘기면 붙여준다.
    비교는 앞 네 자리로 한다 — 두 값 모두 'YYYY-MM-DD' 로 오고, 여기서 `Date` 를 만들면
    위에서 없앤 시간대 이동이 되살아난다.
  */
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  const tail = sameYear ? formatKoreanMonthDay(last) : formatKoreanDate(last);

  return `${firstLabel} ~ ${tail}`;
}

/**
 * ISO 8601 → '2026.4.2'. 동선 카드 하단의 저장일 표시용.
 *
 * ⚠️ 위 함수들과 달리 **시각이 붙은 값**(`createdAt`)을 받는다. 그건 날짜가 아니라 특정
 * 순간이라 현지 시각으로 옮기는 것이 맞다 — `Date` 를 쓰는 이유다.
 */
export function formatSavedDate(value: string | null | undefined) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}
