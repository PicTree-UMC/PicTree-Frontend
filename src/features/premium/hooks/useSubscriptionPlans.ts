import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 요금제 목록 조회 훅.
 *
 * 무료 플랜까지 전부 담아 온다 — 혜택표의 '무료' 열이 필요로 한다.
 * 가격 오름차순으로 정렬해서 화면이 순서를 다시 정하지 않아도 되게 한다
 * (서버 순서에 의존하면 요금제가 추가될 때 카드 순서가 흔들린다).
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: paymentKeys.plans,
    queryFn: getSubscriptionPlans,
    select: (plans) => [...plans].sort((a, b) => a.price - b.price),
  });
};
