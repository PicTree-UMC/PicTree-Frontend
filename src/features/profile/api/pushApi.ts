import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type {
  PushSubscription,
  RegisterPushSubscriptionRequest,
} from '../types/push';

/**
 * PWA 푸시 구독 등록. `POST /push-subscriptions`
 *
 * 근처 나무 알림을 켤 때 브라우저가 만든 구독 정보를 서버에 넘긴다. 이 값이
 * 있어야 `POST /nearby-alerts/check` 가 실제로 알림을 쏜다 — 구독이 없으면
 * 서버는 조용히 `sentCount: 0` 만 돌려준다.
 *
 * **같은 endpoint 로 다시 불러도 안전하다.** 서버가 `upsert` 라 새로 만들지
 * 않고 갱신한다. 구독이 이미 있는지 먼저 확인할 필요가 없다.
 *
 * 실패 코드: 400 `PUSH_SUBSCRIPTION_ENDPOINT_INVALID`(https 가 아니거나 서버
 * 허용 목록 밖), 404 `USER_NOT_FOUND`.
 */
export async function registerPushSubscription(
  request: RegisterPushSubscriptionRequest,
): Promise<PushSubscription> {
  const { data } = await httpClient.post<ApiResponse<PushSubscription>>(
    '/push-subscriptions',
    request,
  );

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}
