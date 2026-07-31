/**
 * 결제 API DTO.
 *
 * 공통 래퍼 { success, code, message, data } 확인됨 → api/paymentApi.ts 에서 data 언랩.
 * 날짜는 ISO 8601 확인됨.
 *
 * 확정: customer-key, POST /billing-keys(요청·응답), POST /subscriptions(응답),
 *   /subscription-plans (2026-07-31 요금제 DB 등록 완료 → 실응답으로 검증).
 * 미확정(? 표시): POST /subscriptions 요청 바디, GET /subscriptions/me 응답.
 */

/**
 * 요금제에 딸린 혜택 1건. 화면의 혜택표·플랜 카드 문구는 전부 여기서 파생된다
 * (하드코딩 금지 — 값이 바뀌면 서버만 고치면 되도록).
 *
 * valueType 이 표시 방법을 정한다:
 *   BOOLEAN → isEnabled 로 켬/끔, 문구는 textValue ('광고 제거' / '광고 표시')
 *   LIMIT   → limitValue + unit ('COUNT' 회, 'MB' 용량). textValue 는 null 이다.
 */
export interface PlanFeatureDto {
  code: string; // 'AD_FREE' | 'AI_BLOG_MONTHLY' | 'PHOTO_STORAGE' (그 외 추가될 수 있음)
  name: string; // '광고 제거'
  description: string;
  valueType: 'BOOLEAN' | 'LIMIT';
  unit: 'COUNT' | 'MB' | null;
  isEnabled: boolean;
  limitValue: number | null;
  textValue: string | null;
}

/**
 * GET /subscription-plans — 요금제 1건. 2026-07-31 실서버 응답으로 검증됨.
 *
 * 무료(FREE)도 목록에 함께 온다 — 혜택표의 '무료' 열이 이걸 쓴다.
 * 결제 카드에 그리는 건 price > 0 인 것만.
 */
export interface SubscriptionPlanDto {
  id: number; // POST /subscriptions 의 subscriptionPlanId 로 그대로 넘긴다
  code: string; // 'FREE' | 'PLUS' | 'PRO' | 'MAX'
  name: string; // '플러스 플랜'
  price: number; // 2900 (원, 부가세 포함 여부는 백엔드 확인 필요)
  billingCycle: 'MONTHLY' | 'YEARLY' | 'NONE'; // 무료는 'NONE'
  description: string;
  features: PlanFeatureDto[];
}

/** GET /billing-keys/customer-key — 프론트가 SDK 에 넘길 customerKey 를 백엔드가 발급 */
export interface CustomerKeyResponse {
  customerKey: string; // ✓ 확인됨 (data.customerKey)
}

/** POST /billing-keys 요청 — 토스 인증 성공(successUrl)에서 받은 값을 백엔드에 전달 (확정) */
export interface RegisterBillingKeyRequest {
  authKey: string; // ✓ 확인됨: { authKey, customerKey } 두 개
  customerKey: string; // 백엔드 발급 (예: 'USER-1-7F4A8D')
}

/** 등록된 자동결제 수단(카드). POST /billing-keys 응답 & GET /billing-keys 배열 항목 */
export interface BillingKeyDto {
  billingKeyId: number;
  paymentProvider: string; // 'TOSS'
  cardCompany: string; // 카드사 코드 문자열 ('11' 등)
  cardNumberMasked: string;
  status: string; // 'ACTIVE' 확인, 그 외 값 미확인
  issuedAt: string; // ISO 8601 ✓
}

/** DELETE /billing-keys/{id} 응답 — 삭제(비활성화) 결과 요약 */
export interface BillingKeyDeactivateResult {
  billingKeyId: number;
  status: string; // 'DEACTIVATED'
  deactivatedAt: string; // ISO 8601
}

/** POST /subscriptions 요청 — 구독 시작 (확정) */
export interface StartSubscriptionRequest {
  subscriptionPlanId: number; // ✓ 요금제 숫자 id (GET /subscription-plans 의 id)
  billingKeyId: number; // ✓ POST /billing-keys 응답의 billingKeyId
}

/** 구독에 붙은 요금제 요약 (POST /subscriptions·GET /me 응답 내부) */
export interface SubscriptionPlanSummary {
  id: number;
  code: string; // 'PLUS' 등 대문자 코드
  name: string; // '플러스 플랜'
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'NONE';
}

/** 구독 상태. POST /subscriptions 응답 확정. GET /subscriptions/me 도 이 형태로 추정. */
export interface SubscriptionDto {
  subscriptionId: number;
  status: string; // 'ACTIVE' 확인, 그 외 값 미확인
  plan: SubscriptionPlanSummary;
  startedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  autoRenew: boolean;
  nextBillingAt: string | null; // ISO 8601. 해지(자동갱신 off) 시 null
}

/**
 * GET /subscriptions/me — 내 구독 상태 (구 메모리 store 를 대체한 서버 상태).
 * 확정: 구독 중이면 SubscriptionDto, 미구독이면 404 → api 레이어에서 null 로 변환.
 */
export type MySubscription = SubscriptionDto | null;
