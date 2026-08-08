import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
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

  return unwrapApiResponse(data);
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

  return unwrapApiResponse(data) ?? [];
}

/**
 * 푸시 구독 비활성화. `PATCH /push-subscriptions/{subscriptionId}/deactivate`
 *
 * 근처 나무 알림을 끌 때 부른다. 구독을 지우는 게 아니라 `isActive` 를 false 로
 * 내린다 — 다시 켤 때 브라우저 구독을 새로 만들지 않아도 된다.
 *
 * ⚠️ 구독은 기기마다 하나씩이라 **끄려는 만큼 각각 불러야 한다.** 하나만 끄면
 * 다른 기기로는 알림이 계속 간다. 전부 끄려면 `activeSubscriptionIds` 가 주는
 * id 를 모두 돌려야 한다.
 *
 * 이미 꺼진 구독에 불러도 서버가 확인하고 넘어가므로 에러는 아니다.
 *
 * 실패 코드: 404 `PUSH_SUBSCRIPTION_NOT_FOUND`(없거나 내 것이 아닌 구독).
 */
export async function deactivatePushSubscription(
  subscriptionId: number,
): Promise<void> {
  const { data } = await httpClient.patch<ApiResponse<null>>(
    `/push-subscriptions/${subscriptionId}/deactivate`,
  );

  unwrapApiResponse(data);
}
