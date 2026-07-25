import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJourney } from '../api/journeyApi';
import { journeyKeys } from './useJourneys';
import { useToast } from '@/shared/components';

/**
 * 동선 삭제 mutation 훅.
 * 성공 시 목록을 무효화해 갱신한다 (stateful 목이라 refetch 하면 실제로 줄어든다).
 */
export const useDeleteJourney = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteJourney(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.all });
      showToast('동선이 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToast('삭제에 실패했습니다. 다시 시도해주세요.', 'error');
    },
  });
};
