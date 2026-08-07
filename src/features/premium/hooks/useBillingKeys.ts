import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBillingKey, getBillingKeys, getCustomerKey } from '../api/paymentApi';
import { BILLING_INTENT_STORAGE_KEY, requestBillingAuth } from '../lib/tossPayments';
import { paymentKeys } from './useMySubscription';

/** 등록된 자동결제 수단(카드) 목록 조회 훅. 카드 삭제 후 이 키로 무효화한다. */
export const useBillingKeys = () => {
  return useQuery({
    queryKey: paymentKeys.billingKeys,
    queryFn: getBillingKeys,
  });
};

/**
 * **구독과 무관하게 카드만 등록하는** 훅. 결제 수단 관리 화면의 '카드 등록' 이 쓴다.
 *
 * `useBillingCheckout` 과 앞부분이 같다(customerKey 발급 → 토스 인증창). 다른 건 딱
 * 둘 — 요금제 id 를 안 담고, 의도를 `register-card` 로 적는다. 그래서 착지 페이지가
 * 빌링키만 발급하고 구독 시작(POST /subscriptions)은 건너뛴다.
 *
 * 두 훅을 하나로 합치지 않는 이유: 합치면 '플랜 id 가 있으면 구독, 없으면 카드만' 이
 * 되는데 그건 세션 유실과 구분이 안 된다(`tossPayments.ts` 의 ⚠️ 참고).
 */
export const useCardRegistration = () => {
  return useMutation({
    mutationFn: async () => {
      const customerKey = await getCustomerKey();
      sessionStorage.setItem(BILLING_INTENT_STORAGE_KEY, 'register-card');
      await requestBillingAuth(customerKey); // 성공 시 리다이렉트 (반환 없음)
    },
    onError: (error) => {
      console.error('[billing] 카드 등록 시작 실패:', error);
    },
  });
};

/** 자동결제 수단(카드) 삭제 훅. 성공 시 카드 목록을 무효화한다. */
export const useDeleteBillingKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (billingKeyId: number) => deleteBillingKey(billingKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.billingKeys });
    },
  });
};
