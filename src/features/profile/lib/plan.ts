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

const MB = 1024 ** 2;
const GB = 1024 ** 3;

/**
 * 플랜별 사진 저장 상한.
 *
 * ⚠️ 폴백 전용이다. 실제 용량은 `GET /subscription-plans` 의 `PHOTO_STORAGE`
 * 혜택(MB)에 있고 마이페이지 요약(`ProfileSummary`)은 그쪽을 먼저 쓴다. `GET
 * /subscriptions/me` 의 `plan` 에는 여전히 용량 필드가 없어서, 요금제 목록을 받기
 * 전까지만 이 값이 쓰인다.
 */
export const getStorageLimitBytes = (currentPlan: string): number =>
  currentPlan === 'FREE' ? 100 * MB : 20 * GB;

/*
  `isFreePlan` · `getShortPlanName` 은 지웠다. 둘 다 구 구독 관리 화면
  (`SubscriptionPage`)과 그 플랜 배지에서만 쓰였고, 화면이 사라지면서 남은 사용처가
  없어졌다. 유·무료 판정이 다시 필요해지면 `GET /subscriptions/me` 의 `subscriptionId`
  유무로 보는 쪽이 맞다 — 무료 사용자에게도 서버가 `plan` 을 채워 주기 때문이다.
*/
