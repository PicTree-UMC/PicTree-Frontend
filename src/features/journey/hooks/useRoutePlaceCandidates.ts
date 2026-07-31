import { useQuery } from '@tanstack/react-query';
import { getRoutePlaceCandidates } from '../api/routeCandidatesApi';

/** 조인 결과라 `journeyKeys`(=/routes) 밑에 두지 않는다. 저장해도 이 목록은 안 바뀐다. */
export const routePlaceCandidateKey = ['routePlaceCandidates'] as const;

/**
 * 새 동선을 만들 때 고를 수 있는 장소 목록 훅.
 *
 * `/trees` ⋈ `/timelines` 두 요청을 묶은 것이라 저장된 동선을 볼 때는 필요 없다 →
 * `enabled` 로 꺼서 ② 모드에서 쓸데없는 두 번의 호출이 나가지 않게 한다.
 */
export const useRoutePlaceCandidates = (enabled: boolean) =>
  useQuery({
    queryKey: routePlaceCandidateKey,
    queryFn: getRoutePlaceCandidates,
    enabled,
  });
