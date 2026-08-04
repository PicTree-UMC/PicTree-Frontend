import type { PushSubscription } from '../types/push';

/**
 * 알림이 켜져 있는가.
 *
 * 구독은 기기마다 생기므로 **하나라도 살아 있으면 켜진 것**으로 본다. 폰에서
 * 켜고 노트북에서 끈 경우 폰 알림은 계속 와야 하는데, 전부 활성일 때만 켜짐으로
 * 치면 그 상태가 "꺼짐" 으로 보인다.
 */
export const hasActivePushSubscription = (
  subscriptions: PushSubscription[] | undefined,
): boolean => (subscriptions ?? []).some((subscription) => subscription.isActive);

/**
 * 끌 때 비활성화해야 할 구독 id 들.
 *
 * 이미 꺼진 것은 빼고 준다 — 서버가 `isActive` 를 확인하고 넘어가긴 하지만
 * 불필요한 요청을 보낼 이유가 없다.
 */
export const activeSubscriptionIds = (
  subscriptions: PushSubscription[] | undefined,
): number[] =>
  (subscriptions ?? [])
    .filter((subscription) => subscription.isActive)
    .map((subscription) => subscription.subscriptionId);

/**
 * 이 브라우저의 구독을 골라낸다.
 *
 * `endpoint` 가 기기·브라우저마다 고유해서 이걸로 맞춘다. 이 기기에서만 알림을
 * 끄고 싶을 때 쓴다 — 전체를 끄면 다른 기기 알림까지 멈춘다.
 */
export const findSubscriptionByEndpoint = (
  subscriptions: PushSubscription[] | undefined,
  endpoint: string,
): PushSubscription | undefined =>
  (subscriptions ?? []).find((subscription) => subscription.endpoint === endpoint);
