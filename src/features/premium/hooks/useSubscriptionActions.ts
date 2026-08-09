import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelPlanChange,
  cancelSubscription,
  resumeSubscription,
  schedulePlanChange,
  startSubscription,
} from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * **이미 등록된 카드로** 구독을 시작하는 훅.
 *
 * `useBillingCheckout` 과 갈라지는 지점이 여기다. 저쪽은 토스 인증창을 열어 카드를 새로
 * 받아야만 결제가 되고(그 뒤 `BillingSuccessPage` 가 이어받는다), 이 훅은 앱을 떠나지
 * 않는다 — `POST /subscriptions` 하나로 끝난다.
 *
 * 처음부터 서버는 이걸 지원했다. `POST /subscriptions` 바디가
 * `{ subscriptionPlanId, billingKeyId }` 라 빌링키 id 만 있으면 되는데, 프론트가
 * 카드 목록을 안 보고 **매번** 인증창부터 열고 있었다. 그래서 카드를 등록해 둔 사람도
 * 결제할 때마다 카드번호를 다시 넣어야 했고, 누를 때마다 빌링키가 한 장씩 늘었다.
 *
 * 성공하면 구독 상태를 무효화한다 — 이걸 빼면 방금 결제하고도 화면이 무료로 남는다
 * (staleTime 60초, `BillingSuccessPage` 주석의 그 함정과 같다).
 */
export const useSubscribeWithCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { subscriptionPlanId: number; billingKeyId: number }) =>
      startSubscription(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.me });
    },
    onError: (error) => {
      // 화면엔 토스트 한 줄만 뜨므로 서버가 뭐라 했는지는 이 로그가 유일한 단서다.
      console.error('[checkout] 등록 카드 결제 실패:', error);
    },
  });
};

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

/**
 * 요금제 변경 **예약** 훅.
 *
 * `useSubscribeWithCard` 와 갈라지는 지점: 저쪽은 그 자리에서 청구가 일어나고, 이쪽은
 * 돈이 안 나간다 — 다음 결제일에 적용될 요금제를 바꿔 둘 뿐이다. 그래서 결제 시트를
 * 거치지 않고 확인 모달 하나로 끝난다.
 *
 * 무효화가 특히 중요하다. 응답에 새 `pendingPlanChange` 가 들어 있는데 캐시를 그대로
 * 두면(staleTime 60초) 방금 예약을 걸고도 버튼이 여전히 '변경하기' 로 남아 같은 예약을
 * 두 번 걸려 든다.
 */
export const useSchedulePlanChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { subscriptionId: number; subscriptionPlanId: number }) =>
      schedulePlanChange(params.subscriptionId, {
        subscriptionPlanId: params.subscriptionPlanId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.me });
    },
    onError: (error) => {
      // 화면엔 토스트 한 줄만 뜨므로 서버가 뭐라 했는지는 이 로그가 유일한 단서다.
      console.error('[plan-change] 요금제 변경 예약 실패:', error);
    },
  });
};

/** 예약된 요금제 변경 취소 훅. 성공하면 `pendingPlanChange` 가 null 로 돌아온다. */
export const useCancelPlanChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: number) => cancelPlanChange(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.me });
    },
  });
};
