import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 요금제 목록 조회 훅.
 * 응답 본문 스펙이 나오면 PremiumPage 의 하드코딩 가격 4곳을 이걸로 대체한다.
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: paymentKeys.plans,
    queryFn: getSubscriptionPlans,
  });
};
