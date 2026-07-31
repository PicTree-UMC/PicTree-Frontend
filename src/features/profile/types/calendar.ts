/** 캘린더 하루치. 서버가 나무 개수를 세어 단계로 내려준다. */
export type CalendarDay = {
  /** `2026-04-01` 형태 */
  date: string;
  /** 0~4. 0 은 방문 없음 (`lib/calendarLevel` 참고) */
  level: number;
};

/** `GET /calendar?year=&month=` 응답의 `data`. */
export type TravelCalendar = {
  year: number;
  month: number;
  days: CalendarDay[];
};
