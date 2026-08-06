import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { storageKeys } from '@/features/profile/hooks/useStorageUsage';
import { routePlaceCandidateKey } from '@/features/journey/hooks/useRoutePlaceCandidates';
import { calendarKeys } from '@/features/profile/hooks/useTravelCalendar';
import { timelineKeys } from '@/features/timeline/hooks/useTimeline';
import {
  deleteTree,
  getNearbyTrees,
  getTreeDetail,
  getTrees,
  toggleTreeFavorite,
} from '../api/treesApi';
import type { NearbyTreeItem } from '../types/tree';
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

/**
 * 근처 나무 캐시에서 한 그루를 즉시 빼낸다.
 *
 * 지도 위 "근처 나무 알림" 카드는 목록이 아니라 `treeKeys.nearby` 캐시를 본다
 * (`useNearbyAlertWatcher`). 마커만 지우고 이쪽을 그대로 두면 **방금 지운 장소를
 * 가리키는 알림이 계속 떠 있는다.**
 *
 * 좌표마다 키가 갈리므로(`nearby(lat, lng)`) 한 곳만 고쳐서는 안 되고 접두사로
 * 전부 훑는다.
 */
const removeFromNearbyCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  treeId: string,
) => {
  queryClient.setQueriesData<NearbyTreeItem[]>(
    { queryKey: [...treeKeys.all, 'nearby'] },
    (old) => old?.filter((tree) => String(tree.treeId) !== treeId),
  );
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
      if (!isAuthenticated) return;
      queryClient.invalidateQueries({ queryKey: treeKeys.list() });
      // 타임라인 피드의 하트도 같은 나무를 본다. 안 깨면 지도에서 켠 하트가
      // 타임라인에서는 staleTime(60s) 동안 꺼진 채로 남는다.
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
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
      await queryClient.cancelQueries({ queryKey: treeKeys.all });
      const prev = optimisticListUpdate(queryClient, (markers) =>
        markers.filter((marker) => marker.id !== treeId),
      );
      // 알림 카드가 보는 캐시. 여기서 안 빼면 지운 장소의 알림이 그대로 남는다.
      removeFromNearbyCache(queryClient, treeId);
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeKeys.list(), context.prev);
      // 되살리기는 서버에 다시 물어 맞춘다 — 지우기 전 좌표가 지금과 다를 수 있어
      // 낙관적으로 되돌린 값이 오히려 틀릴 수 있다.
      queryClient.invalidateQueries({ queryKey: [...treeKeys.all, 'nearby'] });
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      /*
        list 만 무효화하면 안 된다 — 근처 나무(`nearby`)·상세(`detail`) 캐시가
        그대로 남는다. 특히 nearby 는 지도 위 알림 카드의 출처라, 지운 장소를
        가리키는 알림이 앱을 다시 켤 때까지 계속 떠 있었다.
      */
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
      /*
        타임라인은 ['timeline'] 이라는 독립 키다. 여기 안 깨면 지도에서 지운 기록이
        staleTime(60s) 동안 타임라인에 그대로 남는다 — 탭을 옮겨도 사라지지 않다가
        한참 뒤에야 빠지는 증상이 이거였다. 동선 후보도 /trees 를 가공한 독립 키라
        같이 깨야 한다(만들 때는 이미 그렇게 하고 있다 — useCreateTreeRecord).
      */
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      queryClient.invalidateQueries({ queryKey: routePlaceCandidateKey });
      // 잔디는 나무 개수로 그려지므로 장소가 사라지면 같이 옅어져야 한다.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      // 나무를 지우면 사진도 함께 지워진다 — 용량도 다시 센다.
      queryClient.invalidateQueries({ queryKey: storageKeys.usage });
    },
  });
};
