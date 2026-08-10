import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { treeStatsKeys } from '@/features/profile/hooks/useTreeStats';
import { calendarKeys } from '@/features/profile/hooks/useTravelCalendar';
import { deleteTree, getTreeDetail, toggleTreeFavorite } from '../api/treesApi';
import { listItemToMarker } from '../lib/treeMapping';
import { DEMO_MARKERS } from '../mocks/markers';
import type { TreeListItem } from '../types/tree';
import { treeSourceKey, useAllTrees } from './useAllTrees';
import type { MapMarkerData } from './useMapMarkers';

/*
  `treeKeys.list()` 는 지웠다 — 지도 몫의 `/trees` 순회를 담던 키인데, 지금은 원본
  (`treeSourceKey` = `['trees','all']`)을 `select` 로 가공한다(이슈 #237).

  ⚠️ `treeKeys.all` 은 그대로 둔다. `['trees']` 라 **원본과 상세를 한 번에 덮는
  접두사**이고, 무효화 나열이 이 하나로 접힌 것이 이 작업의 요지다.
*/
export const treeKeys = {
  all: ['trees'] as const,
  detail: (id: string) => [...treeKeys.all, 'detail', id] as const,
};

/** 원본 → 지도 마커. 모듈 최상위 참조여야 렌더마다 다시 안 돈다(`useAllTrees` 주석). */
const toMarkers = (trees: TreeListItem[]): MapMarkerData[] => trees.map(listItemToMarker);

/** 개발 중에 백엔드·로그인 없이도 지도가 비지 않게 하는 폴백. */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

/**
 * 지도 마커 목록.
 *
 * ⚠️ **목 폴백이 지도에만 남는다.** 예전에는 `getTrees()` 안에 있어서 그 함수를 쓰는
 * 곳이면 어디든 가짜 `treeId` 가 흘러들었다 — 동선 후보가 `home/treesApi` 재사용을
 * 일부러 피한 이유가 그것이었다(가짜 id 가 `POST /routes` 로 새면 400). 원본
 * (`fetchAllTreeItems`)은 깨끗하므로, 폴백은 화면 하나가 자기 사정으로 갖는다.
 */
export const useTrees = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // 토큰이 없으면 부르지 않는다 — `GET /trees` 는 인증이 걸려 있어 401 이 뻔하다.
  const query = useAllTrees({ select: toMarkers, enabled: isAuthenticated });

  if (!isAuthenticated || query.isError) {
    const fallback = USE_MOCK_FALLBACK ? DEMO_MARKERS : [];
    // 폴백을 쓸 때는 로딩·실패 상태를 끈다 — 그릴 것이 이미 있다.
    if (!isAuthenticated || USE_MOCK_FALLBACK) {
      return { ...query, data: fallback, isPending: false, isError: false };
    }
  }

  return query;
};

/*
  `useTreeCount`(+ `treeKeys.count`, `getTreeCount`)는 지웠다. 마이페이지 요약 한 곳이
  쓰던 것인데, 그 값이 이제 `GET /trees/summary` 응답에 사진 장수·용량과 함께 실려 온다
  (`profile/hooks/useTreeStats`). 갈라 뒀던 이유가 "나머지 둘이 느리다" 였으므로
  이유째 없어졌다.
*/

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

/**
 * 원본 캐시를 즉시 갱신하는 낙관적 업데이트 유틸.
 *
 * ⚠️ **마커가 아니라 원본(`TreeListItem`)을 고친다.** 캐시에 든 것이 원본이고 마커는
 * `select` 가 만들어 낸 사본이라, 사본을 고쳐 봐야 다음 계산에서 덮인다. 대신 여기
 * 한 번 고치면 지도·타임라인·동선·블로그·캘린더가 **동시에** 따라온다.
 */
const optimisticSourceUpdate = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (trees: TreeListItem[]) => TreeListItem[],
) => {
  const prev = queryClient.getQueryData<TreeListItem[]>(treeSourceKey);
  queryClient.setQueryData<TreeListItem[]>(treeSourceKey, (old) =>
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
        .getQueryData<TreeListItem[]>(treeSourceKey)
        ?.find((tree) => String(tree.treeId) === treeId);

      if (isAuthenticated) {
        await toggleTreeFavorite(Number(treeId), !current?.isFavorite);
      }
    },
    onMutate: async (treeId) => {
      await queryClient.cancelQueries({ queryKey: treeSourceKey });
      const prev = optimisticSourceUpdate(queryClient, (trees) =>
        trees.map((tree) =>
          String(tree.treeId) === treeId ? { ...tree, isFavorite: !tree.isFavorite } : tree,
        ),
      );
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeSourceKey, context.prev);
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      /*
        타임라인 피드의 하트도 같은 나무를 본다. 예전에는 `['timeline']` 을 따로 깨야
        했는데 — 안 깨면 지도에서 켠 하트가 타임라인에서 60초 꺼진 채 남았다 — 이제
        같은 원본을 보므로 이 한 줄이 둘 다 덮는다.
      */
      queryClient.invalidateQueries({ queryKey: treeSourceKey });
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
      const prev = optimisticSourceUpdate(queryClient, (trees) =>
        trees.filter((tree) => String(tree.treeId) !== treeId),
      );
      return { prev };
    },
    onError: (_error, _treeId, context) => {
      if (context?.prev) queryClient.setQueryData(treeSourceKey, context.prev);
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      /*
        `['trees']` 하나가 원본과 상세를 함께 덮는다.

        ⚠️ 예전에는 여기에 `timelineKeys.all`·`routePlaceCandidateKey` 를 더 나열해야
        했다. 같은 `/trees` 를 가공한 독립 키들이라 하나라도 빠뜨리면 조용히 낡은
        화면이 남았고, 실제로 지도에서 지운 기록이 타임라인에 60초 남는 증상으로
        데였다. 그 키들이 원본으로 접히면서 나열도 사라졌다(이슈 #237).
      */
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
      // 잔디는 `/calendar` 라는 **다른 엔드포인트**다 — 여기 접히지 않으니 따로 깬다.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      // 나무를 지우면 사진도 함께 지워진다 — 용량도 다시 센다.
      queryClient.invalidateQueries({ queryKey: treeStatsKeys.summary });
    },
  });
};
