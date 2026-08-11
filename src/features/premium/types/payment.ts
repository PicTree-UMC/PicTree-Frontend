/**
 * 결제 API DTO.
 *
 * 공통 래퍼 { success, code, message, data } 확인됨 → api/paymentApi.ts 에서 data 언랩.
 * 날짜는 ISO 8601 확인됨.
 *
 * **2026-08-08 스웨거(`/swagger-json`, 서버 생성 문서) 대조로 전부 확정됐다.** 종전에
 * '추정' 으로 남겨 뒀던 `GET /subscriptions/me` 응답도 `POST /subscriptions` 와 같은
 * 형태임이 확인됐고, 그때 빠져 있던 `pendingPlanChange` 를 채웠다.
 *
 * 실제 요금제 값(같은 날 `GET /subscription-plans` 실응답):
 *   FREE 0원 / 100MB / AI 1회 · PLUS 2,900원 / 1GB / 5회
 *   PRO 6,900원 / 5GB / 20회 · MAX 12,900원 / 20GB / 50회
 * ⚠️ 이 값들은 **참고용 기록이다.** 화면은 서버 응답에서 파생한다(`lib/planDisplay`).
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

/**
 * POST /subscriptions/{id}/plan-change 요청 — 요금제 변경 **예약**.
 *
 * ⚠️ `billingKeyId` 를 안 받는다(스웨거 `ChangeSubscriptionPlanRequestDto` 는 이 한 필드가
 * 전부다). 지금 청구하는 게 아니라 다음 결제일에 적용될 요금제를 바꿔 두는 것이라,
 * 결제 수단은 구독에 이미 붙어 있는 것을 그대로 쓴다.
 */
export interface ChangeSubscriptionPlanRequest {
  subscriptionPlanId: number;
}

/** 구독에 붙은 요금제 요약 (POST /subscriptions·GET /me 응답 내부) */
export interface SubscriptionPlanSummary {
  id: number;
  code: string; // 'PLUS' 등 대문자 코드
  name: string; // '플러스 플랜'
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'NONE';
}

/**
 * 예약된 요금제 변경.
 *
 * 플랜을 바꾸면 즉시 바뀌지 않고 **다음 결제일(`effectiveAt`)에 적용**된다 — 이미 낸
 * 이번 주기 요금이 있어서다. 그때까지는 `plan` 이 지금 요금제고 이쪽이 바뀔 요금제다.
 *
 * `POST /subscriptions/{id}/plan-change` 가 이 값을 채우고 `/plan-change/cancel` 이
 * 다시 `null` 로 만든다. 화면에서는 `PendingPlanChangeNotice` 와 `resolvePlanAction`
 * 두 곳이 읽는다 — 예약이 걸린 플랜을 다시 결제하려 드는 길을 막는 것도 이 값이다.
 */
export interface PendingPlanChangeDto {
  plan: SubscriptionPlanSummary;
  /** 변경이 실제로 적용되는 시각. 보통 `nextBillingAt` 과 같다. ISO 8601 */
  effectiveAt: string;
  /** 사용자가 변경을 요청한 시각. ISO 8601 */
  requestedAt: string;
}

/** 구독 상태. `POST /subscriptions`·`GET /subscriptions/me` 및 취소·재개·플랜변경 응답 공통. */
export interface SubscriptionDto {
  subscriptionId: number;
  status: string; // 'ACTIVE' 확인, 그 외 값 미확인
  plan: SubscriptionPlanSummary;
  startedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  autoRenew: boolean;
  nextBillingAt: string | null; // ISO 8601. 해지(자동갱신 off) 시 null
  /** 예약된 요금제 변경. 없으면 null — 위 `PendingPlanChangeDto` 주석 참고. */
  pendingPlanChange: PendingPlanChangeDto | null;
}

/**
 * GET /subscriptions/me — 내 구독 상태 (구 메모리 store 를 대체한 서버 상태).
 * 확정: 구독 중이면 SubscriptionDto, 미구독이면 404 → api 레이어에서 null 로 변환.
 */
export type MySubscription = SubscriptionDto | null;

/**
 * 결제 1건. `GET /payments` 목록 항목이자 `GET /payments/{id}` 응답.
 *
 * 서버 `PaymentResponseDto` 그대로다. 화면 용어로 옮기지 않았다 — 결제는 분쟁이 생기는
 * 자리라 **서버가 부르는 이름 그대로** 두는 편이 문의할 때 서로 같은 것을 가리킨다.
 */
export interface PaymentDto {
  paymentId: number;
  /** 우리가 만든 주문번호(`ORDER_...`). 문의할 때 사용자가 대는 번호다. */
  orderId: string;
  /** 무엇을 샀는지. 화면의 줄 제목이 된다(예: `플러스 플랜 1개월`). */
  orderName: string;
  amount: number;
  /** `PaymentStatus` 참고. 서버가 문자열로 준다 — 모르는 값이 올 수 있어 좁히지 않는다. */
  status: string;
  /** 카드·간편결제 등. 서버가 토스에서 받은 값을 그대로 넘긴다. 없을 수 있다. */
  paymentMethod: string | null;
  /** 토스 `paymentKey`. 화면에는 안 쓰고 문의용으로만 들고 있는다. */
  providerPaymentId: string | null;
  /** 토스 영수증 URL. 결제가 끝난 건에만 있다. */
  receiptUrl: string | null;
  /** 결제 완료 시각. 아직 안 끝난 건은 `null` 이라 `createdAt` 으로 물러난다. */
  paidAt: string | null;
  createdAt: string;
}

/** `GET /payments` 응답. 페이지 정보가 함께 온다. */
export interface PaymentListData {
  items: PaymentDto[] | null;
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/**
 * 결제 상태. 서버 `payments.constant.ts` 의 `PaymentStatus` 와 같은 값이다.
 *
 * ⚠️ **여기 없는 값이 올 수 있다고 보고 쓴다.** 서버가 토스 상태를 넓히면 프론트가 먼저
 * 아는 길이 없어서, 화면은 모르는 상태를 '알 수 없음' 으로 흘려보낸다(지어내지 않는다).
 */
export const PAYMENT_STATUS = {
  ready: 'READY',
  waitingForDeposit: 'WAITING_FOR_DEPOSIT',
  done: 'DONE',
  failed: 'FAILED',
  canceled: 'CANCELED',
} as const;
