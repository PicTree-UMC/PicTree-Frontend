import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSubscription, resumeSubscription } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 구독 자동갱신 해지 훅. 성공 시 내 구독 상태를 무효화해 화면을 최신으로 맞춘다.
 * 해지해도 status 는 ACTIVE 로 남고(만료일까지 이용), autoRenew 만 false 가 된다.
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: number) => cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.me });
    },
  });
};

/** 구독 자동갱신 재개 훅. 성공 시 내 구독 상태 무효화. */
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: number) => resumeSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.me });
    },
  });
};
