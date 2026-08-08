import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { TravelCalendar } from '../types/calendar';

/**
 * 여행 캘린더 조회. `GET /calendar?year=&month=`
 *
 * 하루치는 `{ date, level }` 이고 `level` 은 서버가 나무 개수를 세어 매긴 0~4 다.
 * 프론트가 개수로 다시 나누지 않는다 — 경계(3~4개, 5개 이상)를 양쪽에서 각자
 * 정하면 어긋난다.
 *
 * `month` 는 1~12 다. JS `Date.getMonth()` 가 0-based 라 호출부에서 +1 한 값을
 * 넘겨야 하므로, 이 함수는 이미 1-based 로 받는다고 본다.
 */
export async function getTravelCalendar(
  year: number,
  month: number,
): Promise<TravelCalendar> {
  const { data } = await httpClient.get<ApiResponse<TravelCalendar>>('/calendar', {
    params: { year, month },
  });

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
}
