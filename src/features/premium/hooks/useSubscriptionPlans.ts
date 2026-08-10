import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 요금제 목록 조회 훅.
 *
 * 무료 플랜까지 전부 담아 온다 — 혜택표의 '무료' 열이 필요로 한다.
 *
 * ⚠️ **정렬이 `select` 가 아니라 `queryFn` 안에 있다.** 이 훅은 다섯 화면이 본다
 * (`PremiumPage`·`ProfileSummary`·`PremiumUpsellSheet`·`usePictreeToken`·
 * `BillingSuccessPage`). `select` 에서 `[...plans].sort()` 를 하면 **렌더마다 새 배열**
 * 이라, 값이 같아도 참조가 갈려 그 다섯 곳이 함께 리렌더된다. 한 번 받을 때 한 번만
 * 정렬하면 참조가 고정된다.
 *
 * 정렬 자체는 남긴다 — 서버 순서에 기대면 요금제가 추가될 때 카드 순서가 흔들린다.
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: paymentKeys.plans,
    queryFn: async () => {
      const plans = await getSubscriptionPlans();
      return [...plans].sort((a, b) => a.price - b.price);
    },
    /**
     * **서버 카탈로그다 — 앱을 쓰는 동안 바뀌지 않는다.** 60초 기본값으로는 화면을
     * 옮길 때마다 다시 받았다(다섯 화면이 보는 값이라 그만큼 자주 걸렸다).
     * 요금제가 실제로 바뀌면 새로고침 전까지 옛 값이지만, 그건 배포 주기의 문제다.
     */
    staleTime: Infinity,
  });
};
