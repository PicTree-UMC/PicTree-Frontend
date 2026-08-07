/**
 * 요금제 표시 문구 파생 — `SubscriptionPlanDto.features[]` → 화면 문자열.
 *
 * 화면에 요금제 값을 하드코딩하지 않기 위한 유일한 변환 지점이다.
 * 컴포넌트는 여기서 나온 문자열만 그리고, 값 자체는 서버가 정한다.
 *
 * ⚠️ 되돌리지 말 것: 예전엔 types/premium.ts 의 PLAN_DETAILS 상수가 이 역할을 했는데
 *    실제 가격과 어긋나 있었다(플러스 4,900원 → 서버 2,900원). 상수로 되돌리면 같은
 *    일이 반복된다.
 */

import type { PlanFeatureDto, SubscriptionPlanDto } from '../types/payment';

/** 서버가 쓰는 혜택 코드. 화면이 특정 혜택을 집어 쓸 때만 필요하다. */
export const FEATURE_CODE = {
  adFree: 'AD_FREE',
  aiBlogMonthly: 'AI_BLOG_MONTHLY',
  photoStorage: 'PHOTO_STORAGE',
} as const;

/**
 * 혜택을 늘어놓는 순서. 서버 `features[]` 는 코드 알파벳순으로 와서 그대로 그리면
 * 저장 용량보다 광고 제거가 먼저 나온다 — 유료 전환의 근거가 약한 것부터 읽히는 셈이다.
 *
 * 여기 없는 코드는 뒤에 붙는다. 혜택이 새로 생겨도 화면 코드를 안 고치기 위해서다.
 */
const ROW_ORDER: string[] = [
  FEATURE_CODE.photoStorage,
  FEATURE_CODE.aiBlogMonthly,
  FEATURE_CODE.adFree,
];

const orderOf = (code: string) => {
  const i = ROW_ORDER.indexOf(code);
  return i === -1 ? ROW_ORDER.length : i;
};

/** 혜택을 표시 순서대로 정렬해서 돌려준다. 원본 배열은 건드리지 않는다. */
export const sortedFeatures = (plan: SubscriptionPlanDto): PlanFeatureDto[] =>
  [...plan.features].sort((a, b) => orderOf(a.code) - orderOf(b.code));

export const findFeature = (
  plan: SubscriptionPlanDto,
  code: string,
): PlanFeatureDto | undefined => plan.features.find((f) => f.code === code);

/** 1024MB 단위로 딱 떨어지면 GB 로 줄인다 (100MB · 1GB · 5GB · 20GB). */
export const formatStorage = (mb: number | null): string => {
  if (mb == null) return '-';
  if (mb >= 1024 && mb % 1024 === 0) return `${mb / 1024}GB`;
  return `${mb}MB`;
};

/** 혜택 1건을 표에 넣을 한 칸짜리 문구로. BOOLEAN 은 textValue 를 그대로 쓴다. */
export const formatFeatureValue = (feature: PlanFeatureDto | undefined): string => {
  if (!feature) return '-';
  if (feature.valueType === 'BOOLEAN') return feature.textValue ?? (feature.isEnabled ? '제공' : '미제공');
  if (!feature.isEnabled || feature.limitValue == null) return '사용불가';
  if (feature.unit === 'MB') return formatStorage(feature.limitValue);
  return `월 ${feature.limitValue}회`;
};

/*
  formatFeatureRange('1GB~20GB' 처럼 유료 플랜 전체를 한 칸에 접던 함수)는 지웠다.
  유일한 사용처인 BenefitTable 이 PlanComparison 으로 바뀌면서 필요가 없어졌다 —
  비교표가 이제 피커로 고른 플랜 하나만 열로 보여준다(그쪽 주석에 이유를 적어 뒀다).
*/

/**
 * 플랜 소개 카드의 혜택 한 줄. 표가 아니라 문장처럼 읽히게 이름과 값을 붙인다
 * ('사진 저장 1GB', 'AI 블로그 월 5회', '광고 제거').
 *
 * **못 받는 혜택은 `null` 이다.** 소개 카드는 "이 플랜을 사면 무엇이 되는지" 를 말하는
 * 자리라 '광고 표시' 같은 줄이 섞이면 파는 글에 안 되는 것이 끼어든다. 무료와의 대비는
 * 아래 비교 섹션이 맡는다.
 */
export const featureLine = (feature: PlanFeatureDto): string | null => {
  if (!feature.isEnabled) return null;
  if (feature.valueType === 'BOOLEAN') return feature.textValue ?? feature.name;
  if (feature.limitValue == null) return null;
  return `${feature.name} ${formatFeatureValue(feature)}`;
};

/** 소개 카드가 그릴 혜택 줄 묶음 — 표시 순서대로, 못 받는 것은 빠진 채로. */
export const planBenefitLines = (plan: SubscriptionPlanDto): string[] =>
  sortedFeatures(plan)
    .map(featureLine)
    .filter((line): line is string => line !== null);

/** 2900 → '2,900원' */
export const formatPrice = (won: number): string => `${won.toLocaleString('ko-KR')}원`;

/** 플랜 카드·결제 시트가 쓰는 요약 문구 묶음. */
export const planSummary = (plan: SubscriptionPlanDto) => ({
  /** '플러스 플랜' — 서버 name 그대로 */
  name: plan.name,
  /**
   * '플러스' — 카드 한 줄이 이름·용량·횟수를 다 담아야 해서 390px 에서 넘친다.
   * 뒤의 '플랜' 만 떼고, 접미사가 없으면 name 그대로 둔다.
   */
  shortName: plan.name.replace(/\s*플랜$/, ''),
  /** '1GB' */
  storage: formatStorage(findFeature(plan, FEATURE_CODE.photoStorage)?.limitValue ?? null),
  /** '월 5회' */
  generations: formatFeatureValue(findFeature(plan, FEATURE_CODE.aiBlogMonthly)),
  /** '2,900원' */
  price: formatPrice(plan.price),
  description: plan.description,
});
