import { useQuery } from '@tanstack/react-query';
import { getRoutePlaceCandidates } from '../api/routeCandidatesApi';

/** `/trees` 를 동선 관점으로 가공한 것이라 `routeKeys`(=/routes) 밑에 두지 않는다. */
export const routePlaceCandidateKey = ['routePlaceCandidates'] as const;

/**
 * 새 동선을 만들 때 고를 수 있는 장소 목록 훅.
 *
 * 저장된 동선을 볼 때는 필요 없다 → `enabled` 로 꺼서 ② 모드에서 쓸데없는 호출이
 * 나가지 않게 한다. (통합 전에는 `/trees` ⋈ `/timelines` 두 번이었다 — #123)
 */
export const useRoutePlaceCandidates = (enabled: boolean) =>
  useQuery({
    queryKey: routePlaceCandidateKey,
    queryFn: getRoutePlaceCandidates,
    enabled,
  });
