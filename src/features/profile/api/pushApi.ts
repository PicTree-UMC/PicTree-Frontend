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

/**
 * 내 푸시 구독 목록 조회. `GET /push-subscriptions/me`
 *
 * ⚠️ **배열이다.** 명세서는 객체 하나로 적어 뒀지만 구독은 기기·브라우저마다
 * 하나씩 생긴다 — 폰과 노트북에서 각각 로그인하면 두 개다.
 *
 * ⚠️ 구독이 없어도 **빈 배열로 200** 이 온다. 명세서의 404
 * `PUSH_SUBSCRIPTION_NOT_FOUND` 는 이 경로로 나가지 않는다. 구독이 없는 것은
 * 에러가 아니라 "알림을 안 켠 상태" 라서 그게 맞다.
 *
 * 알림이 켜져 있는지는 `isActive` 가 하나라도 true 인지로 판단한다
 * (`hasActivePushSubscription`).
 */
export async function getMyPushSubscriptions(): Promise<PushSubscription[]> {
  const { data } =
    await httpClient.get<ApiResponse<PushSubscription[]>>('/push-subscriptions/me');

  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data ?? [];
}
