import { useMutation } from '@tanstack/react-query';
import { getCustomerKey } from '../api/paymentApi';
import {
  BILLING_INTENT_STORAGE_KEY,
  PENDING_PLAN_STORAGE_KEY,
  requestBillingAuth,
} from '../lib/tossPayments';

/**
 * "결제하기" 를 누르면 실행되는 결제 시작 훅.
 *
 * 1) 백엔드에서 customerKey 발급
 * 2) 선택 요금제 id 를 sessionStorage 에 저장 (리다이렉트로 React 상태가 날아가므로)
 * 3) 토스 카드 인증창 열기 → 성공 시 successUrl 로 페이지가 이동한다
 *
 * 이후(빌링키 발급·구독 시작)는 BillingSuccessPage 가 이어받는다.
 * 저장하는 값은 서버 요금제 id(POST /subscriptions 의 subscriptionPlanId) 그대로다 —
 * 로컬 이름을 저장했다가 착지 페이지에서 id 로 번역하던 임시 매핑은 없앴다.
 */
export const useBillingCheckout = () => {
  return useMutation({
    mutationFn: async (subscriptionPlanId: number) => {
      const customerKey = await getCustomerKey();
      sessionStorage.setItem(BILLING_INTENT_STORAGE_KEY, 'subscribe');
      sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, String(subscriptionPlanId));
      await requestBillingAuth(customerKey); // 성공 시 리다이렉트 (반환 없음)
    },
    onError: (error) => {
      // 결제 시작 실패는 지금까지 조용히 삼켜졌다. 최소한 콘솔엔 남겨 원인 추적이 되게 한다.
      console.error('[checkout] 결제 시작 실패:', error);
    },
  });
};
