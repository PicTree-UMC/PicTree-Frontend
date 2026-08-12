/** UTC가 아닌 기기의 현지 날짜를 YYYY-MM-DD 형식으로 반환. */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 날짜만 있는 값(`2026-08-01`)인지. 시각이 붙은 ISO 8601 과 갈라야 한다 — 아래 ⚠️ 참고. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 화면에 찍을 연·월·일. 읽을 수 없으면 `null`. */
type DateParts = { year: number; month: number; day: number };

/**
 * 서버 날짜 문자열 → 연·월·일.
 *
 * ⚠️ **날짜만 있는 값은 `Date` 에 넣지 않는다.** `new Date('2026-08-01')` 은 그 값을
 * **UTC 자정**으로 읽는데, 뒤이어 부르는 `getFullYear()` 들은 **기기 현지 시각**이다.
 * 그래서 UTC 보다 뒤인 지역에서는 하루가 밀린다 — 실측:
 *
 * | 기기 시간대 | `new Date('2026-08-01')` 로 찍으면 |
 * | --- | --- |
 * | Asia/Seoul · Europe/London | 2026년 8월 1일 |
 * | America/New_York · Pacific/Honolulu | **2026년 7월 31일** |
 *
 * 여행 앱이라 이건 가정이 아니다. 그래서 날짜만 있는 값은 문자열 그대로 쪼갠다(시간대를
 * 아예 거치지 않는다). 시각이 붙은 값(`2026-08-01T09:00:00Z`)은 **특정 순간**을 가리키는
 * 것이 맞으므로 그때는 `Date` 로 현지 시각을 구한다.
 */
function toDateParts(value: string | null | undefined): DateParts | null {
  if (!value) return null;

  const dateOnly = DATE_ONLY.exec(value);

  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const parts = { year: Number(y), month: Number(m), day: Number(d) };
    // '2026-13-45' 같은 값을 '2026년 13월 45일' 로 그리지 않는다.
    const isValid = parts.month >= 1 && parts.month <= 12 && parts.day >= 1 && parts.day <= 31;
    return isValid ? parts : null;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/**
 * 날짜 문자열을 "2026년 4월 29일" 형식으로.
 *
 * **한국어 날짜 표기의 유일한 구현이다.** 한때 같은 계산이 네 곳에 흩어져 있었고
 * (`route/lib/formatDate` · `blog/lib/formatBlogDate` · `FavoritePostView` 의 로컬 상수),
 * 그중 셋만 `new Date()` 를 써서 **날짜만 있는 값에서 하루 밀리는 문제를 안고 있었다**
 * (이슈 #294, 위 `toDateParts` 주석).
 *
 * ⚠️ **값이 없거나 잘못됐으면 `null` 을 준다.** 예전에는 그대로 `new Date()` 에
 * 넘겼는데, `new Date(null)` 은 Unix epoch 라 화면에 **"1970년 1월 1일 만료"** 가
 * 떴다. 서버가 `expiresAt` 을 null 로 주는 경우(해지 직후 등)에 실제로 그랬다.
 *
 * 호출부가 `null` 을 받아 "-" 든 빈 칸이든 원본 그대로든 스스로 정하게 한다 — 화면마다
 * 없는 날짜를 어떻게 다룰지가 다르고, 그 판단은 여기서 할 수 없다.
 */
export function formatKoreanDate(value: string | null | undefined): string | null {
  const parts = toDateParts(value);
  if (!parts) return null;

  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

/**
 * 같은 값을 해 없이 "4월 29일" 로. 이미 어느 해인지 아는 자리에 쓴다 — 동선 날짜 칩,
 * 같은 해 안의 날짜 범위 뒷부분처럼.
 */
export function formatKoreanMonthDay(value: string | null | undefined): string | null {
  const parts = toDateParts(value);
  if (!parts) return null;

  return `${parts.month}월 ${parts.day}일`;
}
