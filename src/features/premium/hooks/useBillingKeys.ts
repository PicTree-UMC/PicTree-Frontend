import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBillingKey, getBillingKeys } from '../api/paymentApi';
import { paymentKeys } from './useMySubscription';

/** 등록된 자동결제 수단(카드) 목록 조회 훅. 카드 삭제 후 이 키로 무효화한다. */
export const useBillingKeys = () => {
  return useQuery({
    queryKey: paymentKeys.billingKeys,
    queryFn: getBillingKeys,
  });
};

/** 자동결제 수단(카드) 삭제 훅. 성공 시 카드 목록을 무효화한다. */
export const useDeleteBillingKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (billingKeyId: number) => deleteBillingKey(billingKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.billingKeys });
    },
  });
};
