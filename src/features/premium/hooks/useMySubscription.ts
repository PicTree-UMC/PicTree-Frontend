import { useQuery } from '@tanstack/react-query';
import { getMySubscription } from '../api/paymentApi';

/** 결제/구독 queryKey 규칙. 구독 시작·해지 후 이 키로 상태를 무효화한다. */
export const paymentKeys = {
  plans: ['subscription-plans'] as const,
  me: ['subscription', 'me'] as const,
  billingKeys: ['billing-keys'] as const,
};

/**
 * 내 구독 상태 조회 훅.
 * 프리미엄 여부의 단일 진실. 구 subscriptionStore(메모리 전용, 새로고침 시 소실)를 대체했다.
 * blog 게이팅·구독 관리 화면이 모두 이 훅에서 파생한다.
 */
export const useMySubscription = () => {
  return useQuery({
    queryKey: paymentKeys.me,
    queryFn: getMySubscription,
  });
};
