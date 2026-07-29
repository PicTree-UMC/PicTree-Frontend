/**
 * 구독 플랜 코드 → 화면 표기.
 *
 * 백엔드는 `subscription_plans.code` 를 그대로 내려주고, 구독이 없으면 `'FREE'` 로
 * 대체한다 (`users.service.ts`). 현재 실서버의 요금제 테이블이 비어 있어 `'FREE'`
 * 외의 코드는 확인되지 않았으므로, 나머지는 일괄 '프리미엄' 으로 표기한다.
 *
 * 요금제가 적재되면 실제 코드에 맞춰 이 맵을 채워야 한다 (예: 월간/연간 구분).
 */
const PLAN_LABEL: Record<string, string> = {
  FREE: '무료 플랜',
};

export const getPlanLabel = (currentPlan: string): string =>
  PLAN_LABEL[currentPlan] ?? '프리미엄';

export const isFreePlan = (currentPlan: string): boolean => currentPlan === 'FREE';
