import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  deleteTree,
  getTreeDetail,
  getTrees,
  toggleTreeFavorite,
} from '../api/treesApi';
import type { MapMarkerData } from './useMapMarkers';

export const treeKeys = {
  all: ['trees'] as const,
  list: () => [...treeKeys.all, 'list'] as const,
  detail: (id: string) => [...treeKeys.all, 'detail', id] as const,
};

/** 지도 마커 목록. 토큰 없으면 api 레이어에서 목데이터 폴백. */
export const useTrees = () =>
  useQuery({
    queryKey: treeKeys.list(),
    queryFn: getTrees,
  });

/**
 * 마커 탭 시 상세(코멘트·사진·날짜) 조회.
 * 목데이터(비로그인)에는 상세 API 가 없으므로 로그인 상태에서만 호출한다.
 */
export const useTreeDetail = (treeId: string | null) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: treeKeys.detail(treeId ?? ''),
    queryFn: () => getTreeDetail(Number(treeId)),
    enabled: isAuthenticated && Boolean(treeId),
  });
};

/** 목록 캐시를 즉시 갱신하는 낙관적 업데이트 유틸. */
const optimisticListUpdate = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (markers: MapMarkerData[]) => MapMarkerData[],
) => {
  const prev = queryClient.getQueryData<MapMarkerData[]>(treeKeys.list());
  queryClient.setQueryData<MapMarkerData[]>(treeKeys.list(), (old) =>
    old ? updater(old) : old,
  );
  return prev;
};

/** 즐겨찾기 토글. 비로그인 시 캐시만 낙관적 갱신(로컬 목 데모용). */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: async (treeId: string) => {
      // 지금 값의 반대가 목표 상태다 (명세서가 본문으로 상태를 지정하게 돼 있다)
      const current = queryClient
        .getQueryData<MapMarkerData[]>(treeKeys.list())
        ?.find((marker) => marker.id === treeId);

      if (isAuthenticated) {
        await toggleTreeFavorite(Number(treeId), !current?.isFavorite);
      }
    },
    onMutate: async (treeId) => {
      await queryClient.cancelQueries({ queryKey: treeKeys.list() });
      const prev = optimisticListUpdate(queryClient, (markers) =>
        markers.map((marker) =>
          marker.id === treeId ? { ...marker, isFavorite: !marker.isFavorite } : marker,
        ),
      );
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeKeys.list(), context.prev);
    },
    onSettled: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: treeKeys.list() });
    },
  });
};

/** 나무 삭제. 비로그인 시 캐시만 낙관적 갱신(로컬 목 데모용). */
export const useDeleteTree = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: async (treeId: string) => {
      if (isAuthenticated) await deleteTree(Number(treeId));
    },
    onMutate: async (treeId) => {
      await queryClient.cancelQueries({ queryKey: treeKeys.list() });
      const prev = optimisticListUpdate(queryClient, (markers) =>
        markers.filter((marker) => marker.id !== treeId),
      );
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeKeys.list(), context.prev);
    },
    onSettled: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: treeKeys.list() });
    },
  });
};
