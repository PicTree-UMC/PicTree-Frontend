import type { TravelCalendar } from '../types/calendar';

/**
 * 여행 캘린더 목데이터.
 *
 * 조회한 달에 맞춰 만들어 준다 — 고정 날짜로 두면 다른 달로 넘겼을 때 잔디가
 * 하나도 안 보여 화면이 비어 있는 것처럼 읽힌다.
 *
 * 레벨은 1~4 를 골고루 섞는다. 한 단계만 있으면 색 구분이 맞는지 확인할 수 없다.
 */
export const buildDemoCalendar = (year: number, month: number): TravelCalendar => {
  const lastDay = new Date(year, month, 0).getDate();
  const pad = (value: number) => String(value).padStart(2, '0');

  /** 날짜별 레벨. 달마다 같은 자리에 찍히도록 일(day) 기준으로 정한다. */
  const levelByDay: Record<number, number> = {
    1: 3,
    2: 1,
    7: 4,
    8: 2,
    15: 1,
    16: 4,
    22: 2,
    23: 3,
  };

  const days = Object.entries(levelByDay)
    .map(([day, level]) => ({ day: Number(day), level }))
    .filter(({ day }) => day <= lastDay)
    .map(({ day, level }) => ({
      date: `${year}-${pad(month)}-${pad(day)}`,
      level,
    }));

  return { year, month, days };
};
