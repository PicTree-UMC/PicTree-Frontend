/**
 * 업그레이드 시 **오늘 청구되는 차액**과 그날 붙는 날짜들.
 *
 * 정책(#325):
 *   오늘 결제금액 = (변경 후 월 이용료 − 현재 월 이용료) × 남은 이용일수 ÷ 주기 전체일수
 *   예) 플러스 2,900 → 맥스 12,900, 30일 중 15일 남음 → (12,900−2,900)×15/30 = 5,000원
 *
 * 다운그레이드는 이 계산을 안 탄다 — 오늘 0원이고 다음 결제일에 바뀐다.
 */

import type { SubscriptionPlanDto, SubscriptionPlanSummary } from '../types/payment';

const DAY = 24 * 60 * 60 * 1000;

/**
 * 이번 결제주기가 **시작된** 시각 = 다음 결제일에서 주기 하나를 뺀 값.
 *
 * ⚠️ **`startedAt` 을 쓰면 안 된다.** 그건 **최초** 구독일이라 갱신을 몇 번 거치면 이번
 * 주기 시작일이 아니다 — 두 달 쓴 사람은 주기가 60일로 잡혀 차액이 절반이 된다.
 *
 * ⚠️ `setMonth` 는 말일에서 넘친다(3/31 에서 한 달 빼면 3/3 이 된다). 그래도 여기서는
 * 결과가 '그 달의 실제 길이' 로 수렴해서 쓸 만하다. 정확한 청구액은 어차피 서버가 낸다.
 */
function cycleStart(end: Date, billingCycle: SubscriptionPlanDto['billingCycle']): Date {
  const start = new Date(end);
  if (billingCycle === 'YEARLY') start.setFullYear(start.getFullYear() - 1);
  else start.setMonth(start.getMonth() - 1);
  return start;
}

export type Proration = {
  /** 오늘 청구될 금액(원). */
  chargeAmount: number;
  /** 남은 이용일수 — 문구에 쓰지는 않지만 계산 근거라 함께 낸다. */
  remainingDays: number;
};

/**
 * 업그레이드 차액. **날짜를 모르면 `null`** — 지어내지 않는다.
 *
 * `nextBillingAt` 은 자동갱신을 끄면 서버가 `null` 로 준다. 그 상태에서는 애초에
 * `blocked-canceled` 라 이 계산까지 오지도 않지만, 값이 없을 때 0원이라고 우기지 않도록
 * 여기서도 막는다.
 */
export function upgradeProration(
  currentPlan: SubscriptionPlanSummary,
  nextPlan: SubscriptionPlanDto,
  nextBillingAt: string | null,
): Proration | null {
  if (!nextBillingAt) return null;

  const end = new Date(nextBillingAt);
  if (Number.isNaN(end.getTime())) return null;

  const start = cycleStart(end, nextPlan.billingCycle);
  const cycleDays = Math.round((end.getTime() - start.getTime()) / DAY);
  if (cycleDays <= 0) return null;

  // 남은 날은 올림이다 — 결제일 당일에도 하루치는 남아 있다고 본다.
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));

  return {
    chargeAmount: Math.round(
      ((nextPlan.price - currentPlan.price) * remainingDays) / cycleDays,
    ),
    remainingDays,
  };
}

/**
 * 다운그레이드 확인 모달이 말하는 **현재 플랜의 마지막 날** = 다음 결제일 하루 전.
 * 시안 문구가 `맥스 플랜은 9월 14일까지 이용할 수 있습니다`(결제일 9/15)라 여기서 뺀다.
 */
export function lastDayBefore(nextBillingAt: string | null): string | null {
  if (!nextBillingAt) return null;
  const d = new Date(nextBillingAt);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() - DAY).toISOString();
}
