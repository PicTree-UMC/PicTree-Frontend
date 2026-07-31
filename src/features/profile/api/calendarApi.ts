import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type { TravelCalendar } from '../types/calendar';
import { buildDemoCalendar } from '../mocks/calendar';

/**
 * 개발 환경에서만 목데이터로 폴백한다 (지도·타임라인·즐겨찾기와 같은 방식).
 * 배포 빌드에서는 폴백 없이 실 API 만 쓰고 에러도 그대로 노출한다.
 */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

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
  try {
    const { data } = await httpClient.get<ApiResponse<TravelCalendar>>('/calendar', {
      params: { year, month },
    });

    // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
    if (data.resultType === 'FAIL') {
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      return buildDemoCalendar(year, month);
    }

    throw error;
  }
}
