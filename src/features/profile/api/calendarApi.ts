import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { TravelCalendar } from '../types/calendar';

/**
 * 여행 캘린더 조회. `GET /calendar?year=&month=`
 *
 * 하루치는 `{ date, count, level }` 이고 `level` 은 서버가 `count` 를 세어 매긴 0~4 다.
 * **둘 다 오는데도 프론트가 `count` 로 단계를 다시 나누지 않는다** — 경계(3~4개, 5개 이상)를
 * 양쪽에서 각자 정하면 어긋난다. `count` 는 표시(몇 그루인지)와 하루 한도 계산
 * (`home/lib/treeQuota`) 용이다.
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

  return unwrapApiResponse(data);
}
