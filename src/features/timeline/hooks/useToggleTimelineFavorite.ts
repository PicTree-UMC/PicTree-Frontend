import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { toggleTreeFavorite } from "@/features/home/api/treesApi";
import { useToast } from "@/shared/components";
import type { TimelinePage } from "../types/timeline.types";
import { timelineKeys } from "./useTimeline";

interface ToggleArgs {
  /** 대상 기록 id — 낙관적 갱신으로 하트를 바로 반전할 때 쓴다. */
  id: string;
  /** 즐겨찾기는 나무 단위라 treeId 로 요청한다. 나무 없는 기록은 하트를 안 띄운다. */
  treeId: number;
  /** 현재 값. 목표 상태는 이 값의 반대다. */
  isFavorite: boolean;
}

/**
 * 피드의 즐겨찾기 하트 토글. `PATCH /trees/{treeId}/favorite` (지도·즐겨찾기 화면과 같은 엔드포인트).
 *
 * 응답을 기다리는 동안 캐시를 먼저 뒤집어 하트가 즉시 반응하게 하고, 실패하면 되돌린다.
 * 타임라인 목록 캐시는 page·size 로 키가 갈리므로 `setQueriesData` 로 한꺼번에 갱신한다.
 */
export const useToggleTimelineFavorite = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { showToast } = useToast();

  const patchCache = (id: string, next: boolean) => {
    queryClient.setQueriesData({ queryKey: timelineKeys.all }, (data) => {
      const page = data as TimelinePage | undefined;
      // 같은 접두사를 쓰는 썸네일(Map)·상세 캐시는 records 가 없으니 건드리지 않는다.
      if (!page || !Array.isArray(page.records)) return data;
      return {
        ...page,
        records: page.records.map((record) =>
          record.id === id ? { ...record, isFavorite: next } : record,
        ),
      };
    });
  };

  return useMutation({
    mutationFn: async ({ treeId, isFavorite }: ToggleArgs) => {
      if (isAuthenticated) await toggleTreeFavorite(treeId, !isFavorite);
    },
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: timelineKeys.all });
      patchCache(id, !isFavorite);
    },
    onError: (_error, { id, isFavorite }) => {
      patchCache(id, isFavorite); // 롤백
      showToast("즐겨찾기 변경에 실패했어요.", "error");
    },
    onSettled: () => {
      if (!isAuthenticated) return;
      // 타임라인 목록도 다시 받는다. 목록이 `GET /trees` 로 합쳐지면서 isFavorite 가
      // 응답에 실려 오게 됐다(#129). 서버의 favorite 은 값을 지정하는 게 아니라 순수
      // 토글이라, 우리가 들고 있던 값이 어긋나 있으면 낙관적 반전도 함께 어긋난다 —
      // 재조회로 서버 상태를 그대로 덮어써야 하트가 실제와 어긋난 채 남지 않는다.
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      queryClient.invalidateQueries({ queryKey: ["trees"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};
