import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  deleteTree,
  getNearbyTrees,
  getTreeDetail,
  getTrees,
  toggleTreeFavorite,
} from '../api/treesApi';
import type { MapMarkerData } from './useMapMarkers';

export const treeKeys = {
  all: ['trees'] as const,
  list: () => [...treeKeys.all, 'list'] as const,
  detail: (id: string) => [...treeKeys.all, 'detail', id] as const,
  /**
   * 좌표를 소수점 4자리로 깎아 키에 넣는다 — 약 11m 단위다.
   * 원본 좌표를 그대로 쓰면 GPS 가 미세하게 떨릴 때마다 키가 바뀌어
   * 가만히 서 있어도 요청이 계속 나간다.
   */
  nearby: (lat: number, lng: number) =>
    [...treeKeys.all, 'nearby', lat.toFixed(4), lng.toFixed(4)] as const,
};

/** 지도 마커 목록. 토큰 없으면 api 레이어에서 목데이터 폴백. */
export const useTrees = () =>
  useQuery({
    queryKey: treeKeys.list(),
    queryFn: getTrees,
  });

/**
 * 현재 위치 반경 100m 안의 나무. `GET /trees/nearby`
 *
 * 좌표가 없으면(위치 권한 거부·측위 전) 부르지 않는다. 반경은 서버 상수라
 * 프론트에서 조절할 수 없다.
 *
 * 근처에 없으면 빈 배열이 오고, 그건 정상이다 — 에러가 아니다.
 *
 * ⚠️ 지금은 다른 사람 나무도 섞여 온다(서버 쿼리에 `userId` 조건 없음).
 * 화면에 붙일 때 이 점을 감안해야 한다. 백엔드 수정 요청해 둔 상태다.
 */
export const useNearbyTrees = (
  coords: { lat: number; lng: number } | null,
) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: treeKeys.nearby(coords?.lat ?? 0, coords?.lng ?? 0),
    queryFn: () => getNearbyTrees(coords!.lat, coords!.lng),
    enabled: isAuthenticated && coords != null,
    /**
     * 걸어서 100m 를 벗어나는 데 1~2분은 걸린다. 그 전에 다시 물어도 답이
     * 같으므로 1분은 들고 있는다.
     */
    staleTime: 1000 * 60,
    retry: false,
  });
};

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
