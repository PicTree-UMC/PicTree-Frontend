import { useQuery } from '@tanstack/react-query';
import { getMySubscription } from '../api/paymentApi';

/** 결제/구독 queryKey 규칙. 구독 시작·해지 후 이 키로 상태를 무효화한다. */
export const paymentKeys = {
  plans: ['subscription-plans'] as const,
  me: ['subscription', 'me'] as const,
};

/**
 * 내 구독 상태 조회 훅.
 * subscriptionStore(메모리 전용, 새로고침 시 소실)를 대체할 서버 상태 소스.
 */
export const useMySubscription = () => {
  return useQuery({
    queryKey: paymentKeys.me,
    queryFn: getMySubscription,
  });
};
