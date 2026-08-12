import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { toggleTreeFavorite } from "@/features/home/api/treesApi";
import { useToast } from "@/shared/components";
import { treeSourceKey } from "@/features/home/hooks/useAllTrees";
import { treeKeys } from "@/features/home/hooks/useTrees";
import { favoriteKeys } from "@/features/profile/hooks/useFavorites";
import type { TreeListItem } from "@/features/home/types/tree";

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

  /*
    ⚠️ **원본(`TreeListItem[]`)을 고친다.** 타임라인 레코드는 `select` 가 만든 사본이라
    고쳐 봐야 다음 계산에서 덮인다(이슈 #237). 대신 여기 한 번 고치면 지도 마커의
    하트까지 같이 뒤집힌다 — 예전에 두 캐시를 각각 손대던 일이 한 줄로 접혔다.

    키가 하나라 `setQueriesData` 도 필요 없다. 예전에는 목록 캐시가 page·size 로
    갈려 있어 한꺼번에 훑어야 했다.
  */
  const patchCache = (id: string, next: boolean) => {
    queryClient.setQueryData<TreeListItem[]>(treeSourceKey, (trees) =>
      trees?.map((tree) =>
        String(tree.treeId) === id ? { ...tree, isFavorite: next } : tree,
      ),
    );
  };

  return useMutation({
    mutationFn: async ({ treeId, isFavorite }: ToggleArgs) => {
      if (isAuthenticated) await toggleTreeFavorite(treeId, !isFavorite);
    },
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: treeSourceKey });
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
      /*
        ⚠️ 팩토리를 거친다. 여기만 `["trees"]`·`["favorites"]` 리터럴이었는데, 값이 우연히
        맞아떨어져 동작은 했다 — **그래서 더 위험하다.** 팩토리 쪽이 접두사를 바꾸면 이 두
        줄은 조용히 아무것도 무효화하지 않고, 하트가 서버와 어긋난 채 남는다(이슈 #296).
      */
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};
