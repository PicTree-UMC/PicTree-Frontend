import { useQuery } from '@tanstack/react-query';

import { fetchAllTreeItems } from '../api/treesApi';
import type { TreeListItem } from '../types/tree';

/**
 * `GET /trees` 원본 한 벌.
 *
 * ⚠️ **이 키 밑으로 다섯 화면이 모인다.** 예전에는 같은 `/trees` 를 쿼리 키 다섯 개가
 * 각자 전체 순회했고(지도·캘린더·동선 후보·블로그·타임라인), 순회 구현도 세 벌로
 * 갈려 있었다 — 그중 하나만 100개 상한에 걸린 채 남았던 것이 이슈 #200 이다.
 * 나무 200그루 기준으로 탭을 한 바퀴 돌면 `/trees` 가 9번쯤 나갔다.
 *
 * **각 화면은 "원본을 어떻게 가공하는가" 로만 갈린다** — 지도는 마커, 타임라인은 날짜
 * 그룹, 동선은 방문 순서, 캘린더는 날짜별 묶음. 전부 `select` 자리다.
 *
 * ⚠️ **`select` 는 순수 함수여야 하고, 되도록 모듈 최상위에 두고 참조로 넘긴다.**
 * 인라인 화살표 함수를 넘기면 렌더마다 새 함수라 react-query 가 매번 다시 계산한다
 * (결과가 같아도 참조가 바뀌어 아래로 리렌더가 번진다).
 *
 * ⚠️ 나무가 수천 그루가 되면 이 방식도 답이 아니다(`treesApi` 주석). 그때는 지도
 * 뷰포트(bbox) 조회가 필요한데, **그때 갈아끼울 자리가 여기 하나로 줄어든 것**이
 * 이 통합의 부수 효과다.
 */
export const treeSourceKey = ['trees', 'all'] as const;

interface UseAllTreesOptions<T> {
  /** 원본 → 화면이 쓰는 모양. 없으면 원본 그대로. */
  select?: (items: TreeListItem[]) => T;
  /**
   * 요청을 아예 막을 때. 캘린더·동선 후보는 화면에 들어왔다고 바로 필요한 게 아니라
   * 늦춘다 — 다만 **다른 화면이 이미 받아 뒀으면 캐시에서 즉시 꺼내 쓴다.**
   */
  enabled?: boolean;
  /** 이 관찰자만의 신선도. 키가 같아도 `staleTime` 은 관찰자마다 따로 본다. */
  staleTime?: number;
}

export function useAllTrees<T = TreeListItem[]>({
  select,
  enabled,
  staleTime,
}: UseAllTreesOptions<T> = {}) {
  return useQuery({
    queryKey: treeSourceKey,
    queryFn: fetchAllTreeItems,
    select,
    enabled,
    /*
      ⚠️ **`staleTime: undefined` 를 그냥 넘기면 안 된다.** 옵션 객체에 키가 있으면
      값이 `undefined` 여도 전역 기본값(`queryClient` 의 60초)을 **덮어쓴다** — 그러면
      모든 관찰자가 마운트할 때마다 stale 로 판정돼 탭을 옮길 때마다 요청이 다시 나간다.
      실제로 그렇게 재서 탭 한 바퀴에 7번이 나갔다. 준 것만 넘긴다.
    */
    ...(staleTime === undefined ? {} : { staleTime }),
  });
}
