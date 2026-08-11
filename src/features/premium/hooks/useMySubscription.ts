import { useQuery } from '@tanstack/react-query';
import { getMySubscription } from '../api/paymentApi';

/** 결제/구독 queryKey 규칙. 구독 시작·해지 후 이 키로 상태를 무효화한다. */
export const paymentKeys = {
  plans: ['subscription-plans'] as const,
  me: ['subscription', 'me'] as const,
  billingKeys: ['billing-keys'] as const,
  /**
   * 결제 내역(`GET /payments`).
   *
   * ⚠️ **`me` 밑에 두지 않는다.** 구독 상태는 바뀌는 값이고 내역은 쌓이는 기록이라,
   * 한 접두사로 묶으면 해지·플랜 변경 무효화가 내역까지 매번 다시 부른다.
   */
  history: ['payments', 'history'] as const,
  /** 결제 1건. 목록과 같은 네임스페이스라 `['payments']` 하나로 둘 다 덮인다. */
  detail: (paymentId: number) => ['payments', 'detail', paymentId] as const,
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
    /**
     * **내가 바꿀 때만 변한다** — 구독 시작·해지·재개·플랜 변경이 전부 이 앱 안에서
     * 일어나고, 그 자리마다 `paymentKeys.me` 무효화가 이미 걸려 있다. 60초 기본값은
     * 그 무효화가 없을 때를 가정한 값이라 여기서는 헛돈다.
     *
     * 그래도 `Infinity` 는 아니다 — 만료(`expiresAt`)는 **서버 시간이 지나며** 바뀌고
     * 우리 쪽 무효화가 안 걸린다.
     */
    staleTime: 1000 * 60 * 5,
  });
};
