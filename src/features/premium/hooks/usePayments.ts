import { useQuery } from '@tanstack/react-query';

import { getMyPayments } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/**
 * 내 결제 내역 조회 훅. `GET /payments`
 *
 * ⚠️ **`paymentKeys.me`(구독 상태)와 다른 키다.** 이름이 둘 다 결제지만 성격이 반대다 —
 * 구독은 "지금 어떤 상태인가" 라 내가 바꿀 때만 변하고, 내역은 **한 번 남으면 안 바뀌는
 * 기록**이다. 그래서 구독 해지·변경이 내역을 다시 부를 이유가 없다.
 *
 * 새 결제가 생기면 그때만 낡는다. 결제 성공 화면(`BillingSuccessPage`)이 이 키를 깨면
 * 되는데, **거기서 깨지 않아도 5분 뒤에는 맞다** — 결제 직후 내역을 열어 보는 흐름이
 * 앱에 없어서(내 정보 → 결제 내역으로 들어가야 한다) 그 5분이 문제 되는 자리가 없다.
 */
export const usePayments = () =>
  useQuery({
    queryKey: paymentKeys.history,
    queryFn: getMyPayments,
    staleTime: 1000 * 60 * 5,
  });
