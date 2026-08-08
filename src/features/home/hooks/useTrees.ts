import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { storageKeys } from '@/features/profile/hooks/useStorageUsage';
import { routePlaceCandidateKey } from '@/features/route/hooks/useRoutePlaceCandidates';
import { calendarKeys } from '@/features/profile/hooks/useTravelCalendar';
import { timelineKeys } from '@/features/timeline/hooks/useTimeline';
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

/*
  `GET /trees/nearby` 를 부르던 훅은 지웠다. 이름은 `hooks/useNearbyTrees.ts` 가 이어받아
  같은 일을 요청 없이 한다 — 위 목록에 대고 거리만 다시 잰다(`findNearbyTrees`). 좌표까지
  들어 있는 같은 나무를 두 번 받아 오던 셈이었다. 덤으로 그 API 에 섞여 오던 남의 나무
  (서버 쿼리에 `userId` 조건 없음) 문제도 사라졌다.
*/

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
      /*
        지도 위 알림 카드도 이 목록에서 거리를 재므로(`withinAlertRadius`) 여기서
        빠지면 알림도 같이 사라진다. 예전에는 `nearby` 캐시를 따로 훑어 빼 줘야
        했다 — 안 하면 방금 지운 장소의 알림이 앱을 다시 켤 때까지 떠 있었다.
      */
      const prev = optimisticListUpdate(queryClient, (markers) =>
        markers.filter((marker) => marker.id !== treeId),
      );
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeKeys.list(), context.prev);
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      // 상세(`detail`) 캐시도 함께 깬다 — 지운 나무를 열어 둔 채였을 수 있다.
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
