import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameJourney } from '../api/journeyApi';
import { journeyKeys } from './useJourneys';
import { useToast } from '@/shared/components';

interface RenameJourneyVars {
  id: number;
  title: string;
}

/**
 * 동선 이름 변경 mutation 훅.
 * 성공 시 목록을 무효화해 갱신한다.
 */
export const useRenameJourney = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, title }: RenameJourneyVars) => renameJourney(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.all });
      showToast('이름이 변경되었습니다.', 'success');
    },
    onError: () => {
      showToast('이름 변경에 실패했습니다. 다시 시도해주세요.', 'error');
    },
  });
};
