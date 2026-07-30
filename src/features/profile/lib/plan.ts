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

/** 구독 관리 화면의 플랜 배지에 쓰는 짧은 이름 ("무료" / "맥스"). */
const SHORT_PLAN_NAME: Record<string, string> = {
  FREE: '무료',
};

export const getShortPlanName = (currentPlan: string): string =>
  SHORT_PLAN_NAME[currentPlan] ?? '맥스';

const MB = 1024 ** 2;
const GB = 1024 ** 3;

/**
 * 플랜별 사진 저장 상한.
 *
 * ⚠️ 서버가 주는 값이 아니라 시안(WF-017)에 적힌 수치를 옮긴 것이다. 요금제
 * 테이블이 적재되고 `GET /subscriptions/me` 의 `plan` 에 용량이 실리면 그 값으로
 * 바꿔야 한다 — 지금은 응답에 용량 필드가 없다.
 */
export const getStorageLimitBytes = (currentPlan: string): number =>
  isFreePlan(currentPlan) ? 100 * MB : 20 * GB;
