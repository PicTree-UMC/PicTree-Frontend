/**
 * 결제 API DTO.
 *
 * 공통 래퍼 { success, code, message, data } 확인됨 → api/paymentApi.ts 에서 data 언랩.
 * 날짜는 ISO 8601 확인됨.
 *
 * 확정: customer-key, POST /billing-keys(요청·응답), POST /subscriptions(응답).
 * 미확정(? 표시): /subscription-plans 항목 필드(실서버 data:[]), POST /subscriptions 요청 바디,
 *   GET /subscriptions/me 응답. 스펙 나오면 이 파일과 api 만 고친다.
 */

/**
 * GET /subscription-plans — 요금제 1건.
 *
 * ⚠️ 필드명은 노션 스펙 기준 추측이다. 실서버(tenma.store)는 현재 data:[] (요금제 미등록)
 *    이라 실제 항목 형태를 확인 못 했다. 데이터가 들어오면 검증 필요.
 *    래퍼는 실서버 확인 결과 COMMON200(ApiResponse) 형식 — 노션의 resultType 형식이 아님.
 */
export interface SubscriptionPlanDto {
  id: number;
  name: string; // 내부 코드 'PREMIUM_MONTHLY' / 'PREMIUM_YEARLY'
  displayName: string; // 표시명 '프리미엄 월간'
  price: number; // 9900
  currency: string; // 'KRW'
  billingCycle: 'MONTHLY' | 'YEARLY';
  description: string;
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
  name: string; // '플러스'
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
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
