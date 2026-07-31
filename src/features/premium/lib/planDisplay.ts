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

/**
 * 혜택표의 '프리미엄' 열 — 유료 플랜 전체를 한 칸에 요약한다.
 * 최저·최고가 같으면 한 값만, 다르면 범위로 ('1GB ~ 20GB', '월 5~50회').
 */
export const formatFeatureRange = (
  low: PlanFeatureDto | undefined,
  high: PlanFeatureDto | undefined,
): string => {
  const lowText = formatFeatureValue(low);
  const highText = formatFeatureValue(high);
  if (lowText === highText) return lowText;
  // 횟수는 '월 5회 ~ 월 50회' 가 장황해서 접두사를 한 번만 쓴다.
  if (low?.unit === 'COUNT' && high?.unit === 'COUNT') {
    return `월 ${low.limitValue}~${high.limitValue}회`;
  }
  // 물결 좌우 공백을 두면 '1GB ~ 20GB' 가 375px 혜택표에서 두 줄로 접힌다.
  return `${lowText}~${highText}`;
};

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
