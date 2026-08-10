import { useAllTrees } from '@/features/home/hooks/useAllTrees';
import { toBlogTreeRecords } from '../api/blogPlacesApi';

/*
  `blogTreeQueryKey` 는 지웠다 — 이 화면 몫의 `/trees` 순회가 따로 있었기에 있던 키다.
  지금은 원본(`treeSourceKey`)을 `select` 로 가공하므로 지도·타임라인이 이미 받아 둔
  캐시를 그대로 쓴다(이슈 #237).
*/

/** 블로그 화면이 쓰는 "내 기록" — 원본 나무를 기록 레코드로 옮긴 것. */
export function useBlogTrees() {
  return useAllTrees({ select: toBlogTreeRecords });
}
