import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { treeStatsKeys } from '@/features/profile/hooks/useTreeStats';
import { calendarKeys } from '@/features/profile/hooks/useTravelCalendar';
/* ⚠️ 키는 `lib/favoriteKeys` 에서 온다 — `hooks/useFavorites` 가 이 파일의 `treeKeys` 를
   가져다 쓰므로, 그쪽에서 import 하면 두 모듈이 서로를 불러 TDZ 로 죽는다. */
import { favoriteKeys } from '@/features/profile/lib/favoriteKeys';
import type { FavoriteList, FavoritePlace } from '@/features/profile/types/favorite';
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
 *
 * ⚠️ **폴백은 `enabled` 를 여는 게 아니라 결과를 갈아끼우는 자리에 있다**(아래 `if` 블록).
 * 그래서 `enabled` 에 `import.meta.env.DEV` 를 넣어 봐야 목데이터가 생기지 않는다 — 토큰
 * 없는 요청이 나가 401 을 받을 뿐이다. 프로필 훅 셋(`useTravelCalendar`·`useFavorites`·
 * `useCalendarTrees`)이 그 오해로 DEV 예외를 달고 있었고 정작 그 API 들엔 폴백이 없었다
 * (이슈 #291). 이 저장소의 목 폴백은 여기 하나뿐이다.
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

/**
 * 지도 목록의 나무 하나를 즐겨찾기 목록의 항목 모양으로 옮겨 담는다.
 *
 * 다섯 필드가 `TreeListItem` 에 전부 있어서 새로 받아올 것이 없다. 좌표·기분은
 * 즐겨찾기 목록이 안 쓰므로 버린다.
 *
 * ⚠️ `createdAt` 만 결이 다르다 — 서버의 즐겨찾기 응답은 `2026-03-30` 꼴인데 여기
 * 실리는 건 등록 **시각**이다. 화면이 쓰는 곳은 둘 다 견딘다(`formatKoreanDate` 는
 * 시각을 잘라 읽고, 목록 정렬은 `localeCompare` 라 날짜 앞부분이 같으면 순서가
 * 유지된다). 어차피 `onSettled` 의 재조회가 서버 값으로 덮는다.
 */
const treeToFavoritePlace = (tree: TreeListItem): FavoritePlace => ({
  treeId: tree.treeId,
  name: tree.name,
  description: tree.description,
  createdAt: tree.createdAt,
  imageUrl: tree.imageUrl,
});

interface ToggleFavoriteArgs {
  /** 대상 나무 id. 원본 캐시가 `number` 로 들고 있어 비교할 때 문자열로 맞춘다. */
  treeId: string;
  /** 현재 값. 목표 상태는 이 값의 반대다. */
  isFavorite: boolean;
}

/**
 * 즐겨찾기 토글. 비로그인 시 캐시만 낙관적 갱신(로컬 목 데모용).
 *
 * ⚠️ **현재 값을 인자로 받는다 — 캐시에서 읽지 않는다.** 종전에는 `mutationFn` 이
 * `treeSourceKey` 에서 현재 값을 찾아 `!current.isFavorite` 을 목표로 보냈는데,
 * `onMutate` 가 **먼저** 돌아 그 캐시를 이미 뒤집어 놓기 때문에 목표가 아니라 원래
 * 값을 보내고 있었다. 지금은 서버(develop)가 본문을 안 읽고 무조건 뒤집어서 드러나지
 * 않지만, 명세대로 DTO 가 붙는 순간 조용히 반대 상태를 보내게 된다
 * (`toggleTreeFavorite` 주석). 그래서 서버가 바뀌기 전에 먼저 고쳤다.
 *
 * 타임라인 피드의 하트(`useToggleTimelineFavorite` 의 `ToggleArgs`)가 같은 이유로
 * 이미 이 형태다 — 두 훅이 같은 엔드포인트를 쓰므로 모양도 맞춰 둔다.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: async ({ treeId, isFavorite }: ToggleFavoriteArgs) => {
      if (isAuthenticated) {
        await toggleTreeFavorite(Number(treeId), !isFavorite);
      }
    },
    onMutate: async ({ treeId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: treeSourceKey });
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      const nextFavorite = !isFavorite;

      /*
        즐겨찾기 목록에 넣을 항목을 여기서 집어 둔다 — 아래에서 원본을 갱신하지만
        `isFavorite` 만 바뀌고 나머지 필드는 그대로라 어느 쪽을 읽어도 같다.
      */
      const tree = queryClient
        .getQueryData<TreeListItem[]>(treeSourceKey)
        ?.find((item) => String(item.treeId) === treeId);

      const prev = optimisticSourceUpdate(queryClient, (trees) =>
        trees.map((item) =>
          String(item.treeId) === treeId ? { ...item, isFavorite: nextFavorite } : item,
        ),
      );

      /*
        즐겨찾기 목록도 같이 뒤집는다. **키가 `['trees']` 와 `['favorites']` 로 갈려
        접두사로도 안 걸리므로 여기서 직접 손대야 한다** — 반대 방향(즐겨찾기 화면에서
        해제)은 `useRemoveFavorites` 가 이미 지도 목록을 무효화하고 있었는데, 이쪽만
        비어 있어서 목록을 띄워 둔 채 지도에서 켠 하트가 반영되지 않았다.

        목록을 아직 안 받았으면(`!old`) 아무것도 만들지 않는다 — 여기서 지어내면
        `count` 가 서버가 세어 준 값이 아니라 우리가 아는 만큼이 된다. 그 화면은
        마운트할 때 어차피 받아 온다.

        넣는 자리는 맨 뒤여도 된다. 즐겨찾기 화면이 `createdAt` 으로 다시 정렬한다.
      */
      const prevFavorites = queryClient.getQueryData<FavoriteList>(favoriteKeys.all);

      if (tree) {
        queryClient.setQueryData<FavoriteList>(favoriteKeys.all, (old) => {
          if (!old) return old;

          const favorites = nextFavorite
            ? old.favorites.some((place) => place.treeId === tree.treeId)
              ? old.favorites
              : [...old.favorites, treeToFavoritePlace(tree)]
            : old.favorites.filter((place) => place.treeId !== tree.treeId);

          return { count: favorites.length, favorites };
        });
      }

      return { prev, prevFavorites };
    },
    onError: (_error, _args, context) => {
      if (context?.prev) queryClient.setQueryData(treeSourceKey, context.prev);
      if (context?.prevFavorites) {
        queryClient.setQueryData(favoriteKeys.all, context.prevFavorites);
      }
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      /*
        타임라인 피드의 하트도 같은 나무를 본다. 예전에는 `['timeline']` 을 따로 깨야
        했는데 — 안 깨면 지도에서 켠 하트가 타임라인에서 60초 꺼진 채 남았다 — 이제
        같은 원본을 보므로 이 한 줄이 둘 다 덮는다.
      */
      queryClient.invalidateQueries({ queryKey: treeSourceKey });
      /*
        낙관적으로 넣은 항목은 우리가 지어낸 것이라(특히 `count`·`createdAt`) 서버
        값으로 덮는다. 타임라인 토글(`useToggleTimelineFavorite`)이 이미 같은 줄을
        갖고 있다 — 지도 쪽에만 빠져 있었다.
      */
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
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
