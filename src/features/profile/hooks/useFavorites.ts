import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/shared/components';
import { getFavorites, removeFavorites } from '../api/favoriteApi';
import { isClientError } from '../lib/profileError';
import { getFavoriteErrorMessage } from '../lib/favoriteError';
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
 * 즐겨찾기 해제 훅. `PATCH /trees/{treeId}/favorite` — 한 곳이든 여러 곳이든
 * 배열로 받는다(선택 모드에서 골라 한 번에 빼는 길이 있어서다).
 *
 * **낙관적 갱신을 하지 않는다.** 건별 호출이라 일부만 성공할 수 있는데, 먼저
 * 다 빼 보이고 실패한 것만 되살리면 목록이 두 번 출렁인다. 응답을 받고
 * **실제로 해제된 것만** 뺀다.
 *
 * 지도 쪽에도 같은 엔드포인트를 쓰는 훅(`useToggleFavorite`)이 있다. 캐시 키가
 * 달라 서로 모르므로, 해제 후 지도 목록도 다시 받도록 함께 무효화한다.
 */
export const useRemoveFavorites = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    // 이 화면은 담긴 장소만 다루므로 목표 상태는 항상 "해제" 다
    mutationFn: removeFavorites,

    onSuccess: ({ removedIds, failedCount }) => {
      if (removedIds.length === 0) {
        showToast('즐겨찾기 제거에 실패했습니다. 다시 시도해주세요.', 'error');
        return;
      }

      const removed = new Set(removedIds);

      queryClient.setQueryData<FavoriteList>(favoriteKeys.all, (old) => {
        if (!old) return old;

        const favorites = old.favorites.filter((place) => !removed.has(place.treeId));
        return { count: favorites.length, favorites };
      });

      // 지도 마커의 즐겨찾기 표시도 같이 틀어지지 않게 한다
      queryClient.invalidateQueries({ queryKey: ['trees'] });

      if (failedCount > 0) {
        showToast(
          `${removedIds.length}곳을 제거했어요. ${failedCount}곳은 실패했어요.`,
          'error',
        );
        return;
      }

      showToast(
        removedIds.length === 1
          ? '즐겨찾기에서 제거했어요.'
          : `즐겨찾기에서 ${removedIds.length}곳을 제거했어요.`,
        'success',
      );
    },

    onError: (error) => {
      showToast(
        getFavoriteErrorMessage(error, '즐겨찾기 제거에 실패했습니다. 다시 시도해주세요.'),
        'error',
      );
    },

    /*
      목록이 낡아 있을 수 있어(이미 지워진 나무, 다른 기기에서 뺀 것) 성공·실패
      가리지 않고 서버 값으로 맞춘다. 종전에는 404 일 때만 다시 받았는데, 건별
      호출로 바뀌며 어떤 건이 왜 실패했는지 여기서 알 수 없게 됐다.
    */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};
