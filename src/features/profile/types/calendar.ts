/** 캘린더 하루치. 서버가 나무 개수를 세어 개수와 단계로 함께 내려준다. */
export type CalendarDay = {
  /** `2026-04-01` 형태 */
  date: string;
  /**
   * 그날 심은 나무 수. 하루 한도(`home/lib/treeQuota`)가 생기면서 **집계값(level)과 별개로**
   * 실제 개수가 필요해져 추가됐다 — 오늘 몇 그루를 더 심을 수 있는지가 이 값에서 나온다.
   *
   * ⚠️ 이게 있다고 `level` 을 프론트가 다시 계산하면 안 된다(`lib/calendarLevel` 참고).
   */
  count: number;
  /** 0~4. 0 은 방문 없음 (`lib/calendarLevel` 참고) */
  level: number;
};

/** `GET /calendar?year=&month=` 응답의 `data`. */
export type TravelCalendar = {
  year: number;
  month: number;
  days: CalendarDay[];
};
