import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameRoute } from '../api/routeApi';
import { routeKeys } from './useSavedRoutes';
import { useToast } from '@/shared/components';

interface RenameRouteVars {
  id: number;
  title: string;
}

/**
 * 동선 이름 변경 mutation 훅.
 * 성공 시 목록을 무효화해 갱신한다.
 */
export const useRenameRoute = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, title }: RenameRouteVars) => renameRoute(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.all });
      showToast('이름이 변경되었습니다.', 'success');
    },
    onError: () => {
      showToast('이름 변경에 실패했습니다. 다시 시도해주세요.', 'error');
    },
  });
};
