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

/**
 * 구독 관리 화면의 플랜 배지에 쓰는 짧은 이름 ("무료" / "맥스").
 *
 * ⚠️ 폴백 전용이다. 유료 플랜을 전부 '맥스'로 뭉개므로(플러스 구독자에게도 '맥스'가
 * 뜬다) 요금제 목록을 받았으면 `premium/lib/planDisplay` 의 `planSummary().shortName`
 * 을 쓴다. 여기는 `GET /subscription-plans` 응답이 오기 전 잠깐만 쓰인다.
 */
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
 * ⚠️ 폴백 전용이다. 실제 용량은 `GET /subscription-plans` 의 `PHOTO_STORAGE`
 * 혜택(MB)에 있고 구독 관리 화면은 그쪽을 먼저 쓴다. `GET /subscriptions/me` 의
 * `plan` 에는 여전히 용량 필드가 없어서, 요금제 목록을 받기 전까지만 이 값이 쓰인다.
 */
export const getStorageLimitBytes = (currentPlan: string): number =>
  isFreePlan(currentPlan) ? 100 * MB : 20 * GB;
