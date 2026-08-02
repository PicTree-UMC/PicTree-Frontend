import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type { NearbyAlertCheckResult } from '../types/nearbyAlert';

/**
 * 근처 나무 알림 체크. `POST /nearby-alerts/check`
 *
 * 현재 위치를 서버에 넘기면 서버가 반경 100m 안의 나무를 찾아 푸시를 쏘고
 * 알림 기록을 남긴다. 반경은 서버 상수(`NEARBY_TREE_RADIUS_M = 100`)라
 * 프론트에서 조절할 수 없다.
 *
 * ⚠️ 명세서 RequestBody 는 비어 있지만 서버 `CheckNearbyAlertRequestDto` 는
 * `latitude`·`longitude` 를 요구한다. 둘 다 필수다.
 *
 * **`sentCount` 가 0 이어도 정상일 수 있다.** 서버는 이런 순서로 걸러낸다:
 * 1. `GET /users/me` 의 `notificationEnabled` 가 꺼져 있으면 → 0
 * 2. 활성 푸시 구독이 하나도 없으면 → 0
 * 3. 그 나무에 **오늘(한국 날짜) 이미 보냈으면** → 건너뜀
 *
 * 그래서 `nearbyCount` 는 2 인데 `sentCount` 가 0 인 상황이 흔하다. 실패로
 * 취급하면 안 된다.
 *
 * ⚠️ 서버가 `trees` 의 `findNearbyTrees` 를 그대로 쓰는데 그 쿼리에 `userId`
 * 조건이 없다. 지금은 **다른 사람 나무에 대한 알림도 발송된다.** 백엔드에
 * 수정 요청해 둔 상태다.
 */
export async function checkNearbyAlerts(
  latitude: number,
  longitude: number,
): Promise<NearbyAlertCheckResult> {
  const { data } = await httpClient.post<ApiResponse<NearbyAlertCheckResult>>(
    '/nearby-alerts/check',
    { latitude, longitude },
  );

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}
