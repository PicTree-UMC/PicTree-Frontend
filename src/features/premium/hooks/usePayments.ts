import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getMyPayment, getMyPayments } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 내 결제 내역(완료 건만). `GET /payments?status=DONE`
 *
 * ⚠️ **`paymentKeys.me`(구독 상태)와 다른 키다.** 이름이 둘 다 결제지만 성격이 반대다 —
 * 구독은 "지금 어떤 상태인가" 라 내가 바꿀 때만 변하고, 내역은 **한 번 남으면 안 바뀌는
 * 기록**이다. 그래서 구독 해지·변경이 내역을 다시 부를 이유가 없다.
 *
 * 페이지를 이어 붙인다. 첫 화면에 20건이면 대부분의 사용자에게 충분하고, 결제가 쌓인
 * 계정만 '더 보기' 를 누른다 — 처음부터 100건을 받으면 안 볼 데이터를 매번 실어 나른다.
 */
export const usePayments = () =>
  useInfiniteQuery({
    queryKey: paymentKeys.history,
    queryFn: ({ pageParam }) => getMyPayments(pageParam),
    initialPageParam: 1,
    /**
     * ⚠️ `totalPages` 를 믿되 **`items` 가 빈 페이지도 끝으로 본다.** 서버가 `page` 를
     * 무시하는 상황(`/trees` 에서 겪은 그것)이면 같은 페이지가 무한히 이어질 수 있다.
     */
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page < lastPage.totalPages && (lastPage.items?.length ?? 0) > 0;

      return hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

/**
 * 결제 1건. `GET /payments/{id}`
 *
 * 목록에서 이미 같은 값을 받아 두지만 **목록 캐시에서 꺼내 쓰지 않는다** — 상세는 링크로
 * 바로 열릴 수 있고(새로고침·공유), 그때 목록이 없으면 화면이 빈다.
 */
export const usePaymentDetail = (paymentId: number) =>
  useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => getMyPayment(paymentId),
    enabled: Number.isInteger(paymentId) && paymentId > 0,
    staleTime: 1000 * 60 * 5,
  });
