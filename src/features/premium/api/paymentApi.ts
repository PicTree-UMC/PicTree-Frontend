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
 */

import axios from 'axios';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type {
  BillingKeyDto,
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
