import { useAllTrees } from '@/features/home/hooks/useAllTrees';
import { toRoutePlaceCandidates } from '../api/routeCandidatesApi';

/*
  `routePlaceCandidateKey` 는 지웠다 — 이 화면 몫의 `/trees` 순회가 따로 있었기에 있던
  키다. 지금은 원본(`treeSourceKey`)을 `select` 로 가공하므로 무효화도 그쪽 하나로
  접힌다(이슈 #237).
*/

/**
 * 새 동선을 만들 때 고를 수 있는 장소 목록 훅.
 *
 * 저장된 동선을 볼 때는 필요 없다 → `enabled` 로 꺼서 ② 모드에서 쓸데없는 호출이
 * 나가지 않게 한다. (통합 전에는 `/trees` ⋈ `/timelines` 두 번이었다 — #123)
 *
 * 다만 지금은 `enabled` 가 **요청만 막는다** — 지도나 타임라인이 이미 원본을 받아 뒀으면
 * 켜지는 순간 캐시에서 즉시 나온다.
 */
export const useRoutePlaceCandidates = (enabled: boolean) =>
  useAllTrees({ select: toRoutePlaceCandidates, enabled });
