import type { MySubscription } from '../types/payment';

/**
 * 비교표에서 고른 플랜에 대해 지금 할 수 있는 일.
 *
 * 버튼 안에서 조건을 겹쳐 쓰지 않고 여기서 한 번에 가른다. 조건이 여섯 갈래라
 * (구독 여부 × 지금 플랜 × 예약 × 자동갱신) JSX 안에 삼항으로 늘어놓으면 어느
 * 갈래가 빠졌는지 눈으로 못 센다.
 *
 * - `start` — 미구독. 결제로 들어간다(`POST /subscriptions`).
 * - `upgrade` — 구독 중이고 **더 비싼** 플랜. 남은 기간 차액을 받고 **즉시** 바뀐다.
 * - `downgrade` — 구독 중이고 **더 싼** 플랜. 오늘 0원, **다음 결제일**에 바뀐다.
 * - `current` — 지금 쓰는 플랜. 또 결제하면 중복이라 막는다.
 * - `pending` — **이 플랜으로 이미 예약이 걸려 있다.** 같은 예약을 두 번 걸 이유가 없다.
 * - `blocked-canceled` — 자동갱신이 꺼져 있다. 다음 결제일이 없으니 예약을 걸 시점도
 *   없다(서버도 409 로 막을 자리다). 먼저 자동갱신을 켜게 안내한다.
 * - `blocked-pending` — **다른 플랜으로 예약이 걸려 있다.** 예약 위에 예약을 덮어쓸 수
 *   있는지 스웨거가 말해 주지 않아(409 설명이 "플랜을 변경할 수 없는 구독입니다" 로
 *   뭉뚱그려져 있다) 겹쳐 걸지 않는다. 기존 예약을 취소하고 다시 걸게 한다.
 */
export type PlanAction =
  | 'start'
  | 'upgrade'
  | 'downgrade'
  | 'current'
  | 'pending'
  | 'blocked-canceled'
  | 'blocked-pending';

/**
 * ⚠️ `subscription.plan` 만 보면 안 된다 — 구독한 적 없는 사용자에게도 서버가 `plan` 을
 * 채워 준다(무료). `subscriptionId` 가 있어야 실제 구독이다.
 *
 * 방향은 **가격 비교**로 가른다(#325). `id` 나 코드 순서가 아니라 값이 기준이라,
 * 요금제가 늘거나 순서가 바뀌어도 이 함수를 안 고친다.
 */
export function resolvePlanAction(
  subscription: MySubscription | undefined,
  plan: { id: number; price: number },
): PlanAction {
  if (!subscription?.subscriptionId) return 'start';

  if (subscription.plan.id === plan.id) return 'current';

  const pending = subscription.pendingPlanChange;
  if (pending?.plan.id === plan.id) return 'pending';

  // 해지 상태를 예약보다 먼저 본다 — 자동갱신이 꺼져 있으면 어느 플랜을 골랐든
  // 할 수 있는 일이 '자동갱신 켜기' 하나뿐이라, 그 안내가 예약 안내보다 앞선다.
  if (!subscription.autoRenew) return 'blocked-canceled';

  if (pending) return 'blocked-pending';

  return plan.price > subscription.plan.price ? 'upgrade' : 'downgrade';
}
