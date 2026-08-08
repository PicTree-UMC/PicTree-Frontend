/**
 * 결제/구독 백엔드 API 레이어.
 *
 * 엔드포인트 경로 확정. 공통 응답 래퍼 확인됨({ success, code, message, data }) →
 * 실제 payload 는 response.data.data 에 있다. 각 함수가 그 한 겹을 벗겨 반환한다.
 *
 * baseURL 에 이미 `/api/v1` 이 포함돼 있으므로(HANDOFF 10절) 경로는 그 뒤만 적는다.
 *
 * ⚠️ 아직 미확정: /subscription-plans, /subscriptions/me, POST 본문들의 필드명.
 *    (`? 확인` 표시) 스펙 나오면 types/payment.ts 와 이 파일만 고친다.
 *
 * 구독에 서버가 주는 동작은 넷이다 — 시작(`POST /subscriptions`) · 해지(`/cancel`) ·
 * 재개(`/resume`) · **요금제 변경 예약(`/plan-change`, `/plan-change/cancel`)**.
 * 마지막 둘은 한동안 없는 줄 알고 안 붙여 뒀었다(2026-08-09 스웨거로 확인해 추가).
 */

import axios from 'axios';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type {
  BillingKeyDeactivateResult,
  BillingKeyDto,
  ChangeSubscriptionPlanRequest,
  CustomerKeyResponse,
  MySubscription,
  RegisterBillingKeyRequest,
  StartSubscriptionRequest,
  SubscriptionDto,
  SubscriptionPlanDto,
} from '../types/payment';

/**
 * GET /subscription-plans — 요금제 목록.
 * 실서버 확인: COMMON200 래퍼 + data 는 배열 직접(현재 []). 인증 불필요.
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlanDto[]> => {
  const { data } = await httpClient.get<ApiResponse<SubscriptionPlanDto[]>>(
    '/subscription-plans',
  );
  return data.data;
};

/** GET /billing-keys/customer-key — SDK 에 넘길 customerKey 발급 (필드명 확인됨) */
export const getCustomerKey = async (): Promise<string> => {
  const { data } = await httpClient.get<ApiResponse<CustomerKeyResponse>>(
    '/billing-keys/customer-key',
  );
  return data.data.customerKey;
};

/** POST /billing-keys — 토스 인증 후 authKey 로 빌링키 발급(카드 등록) */
export const registerBillingKey = async (
  body: RegisterBillingKeyRequest,
): Promise<BillingKeyDto> => {
  const { data } = await httpClient.post<ApiResponse<BillingKeyDto>>(
    '/billing-keys',
    body,
  );
  return data.data;
};

/** POST /subscriptions — 구독 시작(첫 청구). 생성된 구독 정보를 반환 */
export const startSubscription = async (
  body: StartSubscriptionRequest,
): Promise<SubscriptionDto> => {
  const { data } = await httpClient.post<ApiResponse<SubscriptionDto>>(
    '/subscriptions',
    body,
  );
  return data.data;
};

/**
 * GET /subscriptions/me — 내 구독 상태.
 * 미구독은 404 로 오는데, 이건 에러가 아니라 정상 상태이므로 null 로 변환한다.
 */
export const getMySubscription = async (): Promise<MySubscription> => {
  try {
    const { data } = await httpClient.get<ApiResponse<SubscriptionDto>>(
      '/subscriptions/me',
    );
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null; // 미구독
    }
    throw err;
  }
};

/** GET /billing-keys — 등록된 자동결제 수단(카드) 목록 */
export const getBillingKeys = async (): Promise<BillingKeyDto[]> => {
  const { data } = await httpClient.get<ApiResponse<BillingKeyDto[]>>('/billing-keys');
  return data.data;
};

/** DELETE /billing-keys/{id} — 자동결제 수단 삭제(비활성화) */
export const deleteBillingKey = async (
  billingKeyId: number,
): Promise<BillingKeyDeactivateResult> => {
  const { data } = await httpClient.delete<ApiResponse<BillingKeyDeactivateResult>>(
    `/billing-keys/${billingKeyId}`,
  );
  return data.data;
};

/** POST /subscriptions/{id}/cancel — 자동갱신 해지 (status 는 ACTIVE 유지, autoRenew=false) */
export const cancelSubscription = async (
  subscriptionId: number,
): Promise<SubscriptionDto> => {
  const { data } = await httpClient.post<ApiResponse<SubscriptionDto>>(
    `/subscriptions/${subscriptionId}/cancel`,
  );
  return data.data;
};

/** POST /subscriptions/{id}/resume — 자동갱신 재개 (autoRenew=true, nextBillingAt 복귀) */
export const resumeSubscription = async (
  subscriptionId: number,
): Promise<SubscriptionDto> => {
  const { data } = await httpClient.post<ApiResponse<SubscriptionDto>>(
    `/subscriptions/${subscriptionId}/resume`,
  );
  return data.data;
};

/**
 * POST /subscriptions/{id}/plan-change — 요금제 변경 **예약**.
 *
 * ⚠️ **즉시 바뀌지 않는다.** 응답 `pendingPlanChange.effectiveAt` 이 다음 결제일이고,
 * 그때까지 `plan` 은 지금 요금제 그대로다(스웨거: "구독 플랜 변경이 예약되었습니다").
 * 이번 주기 요금을 이미 냈기 때문이라, 프론트가 바꿀 수 있는 정책이 아니다 —
 * 화면 문구가 "다음 결제일부터" 로 말해야 한다.
 *
 * 이 함수가 없던 동안 업그레이드는 `startSubscription`(구독 **시작**)으로 나가고 있었고,
 * 서버가 409 `이미 이용 중인 구독이 있습니다` 로 막았다. 이중결제는 안 났지만 화면에는
 * "카드 상태를 확인해 주세요" 가 떠서, 카드를 바꿔도 안 되는 길이 돼 있었다.
 *
 * 실패 코드: 400 변경 불가 요금제 · 404 구독/요금제 없음 · 409 변경 불가 구독.
 */
export const schedulePlanChange = async (
  subscriptionId: number,
  body: ChangeSubscriptionPlanRequest,
): Promise<SubscriptionDto> => {
  const { data } = await httpClient.post<ApiResponse<SubscriptionDto>>(
    `/subscriptions/${subscriptionId}/plan-change`,
    body,
  );
  return data.data;
};

/**
 * POST /subscriptions/{id}/plan-change/cancel — 예약된 요금제 변경 취소.
 * 본문 없음. 성공하면 응답의 `pendingPlanChange` 가 `null` 이 되고 지금 요금제가 유지된다.
 */
export const cancelPlanChange = async (
  subscriptionId: number,
): Promise<SubscriptionDto> => {
  const { data } = await httpClient.post<ApiResponse<SubscriptionDto>>(
    `/subscriptions/${subscriptionId}/plan-change/cancel`,
  );
  return data.data;
};
