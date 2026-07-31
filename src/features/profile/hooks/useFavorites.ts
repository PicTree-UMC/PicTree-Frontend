import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/shared/components';
import { getApiErrorMessage } from '@/features/auth/lib/apiError';
import { getFavorites, toggleFavorite } from '../api/favoriteApi';
import { isClientError } from '../lib/profileError';
import type { FavoriteList } from '../types/favorite';

export const favoriteKeys = {
  all: ['favorites'] as const,
};

/**
 * 즐겨찾기 목록 조회 훅. `GET /trees/favorites`
 *
 * 토큰이 없어도 개발 환경에서는 돌린다 — `favoriteApi` 가 목데이터로 폴백하므로
 * 막아 버리면 로컬에서 화면이 계속 비어 있게 된다.
 */
export const useFavorites = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: getFavorites,
    enabled: Boolean(accessToken) || import.meta.env.DEV,
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: (query) => !isClientError(query.state.error),
  });
};

/**
 * 즐겨찾기 해제 훅. `PATCH /trees/{treeId}/favorite`
 *
 * 낙관적으로 목록에서 먼저 빼고 실패하면 되돌린다. 확인 모달을 이미 거친 동작이라
 * 응답을 기다리는 동안 그대로 남아 있으면 눌리지 않은 것처럼 보인다.
 *
 * 지도 쪽에도 같은 엔드포인트를 쓰는 훅(`useToggleFavorite`)이 있다. 캐시 키가
 * 달라 서로 모르므로, 해제 후 지도 목록도 다시 받도록 함께 무효화한다.
 */
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (treeId: number) => toggleFavorite(treeId),

    onMutate: async (treeId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      const previous = queryClient.getQueryData<FavoriteList>(favoriteKeys.all);

      if (previous) {
        const favorites = previous.favorites.filter((place) => place.treeId !== treeId);
        queryClient.setQueryData<FavoriteList>(favoriteKeys.all, {
          count: favorites.length,
          favorites,
        });
      }

      return { previous };
    },

    onSuccess: () => {
      // 지도 마커의 즐겨찾기 표시도 같이 틀어지지 않게 한다
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      showToast('즐겨찾기에서 제거했어요.', 'success');
    },

    onError: (error, _treeId, context) => {
      if (context?.previous) {
        queryClient.setQueryData<FavoriteList>(favoriteKeys.all, context.previous);
      }

      showToast(
        getApiErrorMessage(error, '즐겨찾기 제거에 실패했습니다. 다시 시도해주세요.'),
        'error',
      );
    },
  });
};
