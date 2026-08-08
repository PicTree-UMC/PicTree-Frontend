import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getTreeStats } from '../api/treeStatsApi';
import { isClientError } from '../lib/profileError';

export const treeStatsKeys = {
  summary: ['tree-stats', 'summary'] as const,
};

/**
 * 나무·사진 통계 조회 훅 — 그루 수 · 사진 장수 · 사용량(byte).
 *
 * `GET /trees/summary` 요청 하나다. 종전에는 나무 수만큼 요청이 나갔고, 그래서
 * **`staleTime: Infinity`** 로 한 세션에 한 번만 돌게 막아 뒀었다. 그 이유가
 * 없어져 걷어냈다 — 이제 전역 기본값(60초)을 따른다. 마이페이지에 다시 들어오면
 * 60초가 지난 경우 한 요청으로 다시 확인한다.
 *
 * 무효화는 그대로 둔다(`treeStatsKeys.summary`). 캐시가 60초 살아 있는 동안에도 값이
 * 실제로 변하는 순간이 있고, 그때는 기다리지 않고 바로 다시 받아야 한다:
 *  - 사진을 올릴 때 — 나무 기록 생성
 *  - 사진이 사라질 때 — 기록 삭제, 지도에서 나무 삭제
 *
 * 이 세 곳 말고 나무·사진 수를 바꾸는 경로가 생기면 거기서도 무효화해야 한다.
 * 안 하면 화면의 값이 실제와 최대 60초 어긋난 채로 남는다.
 *
 * ⚠️ 위 세 무효화 지점이 이 키를 이름으로 가리킨다 — 키를 고치면 그 셋이 같이 움직인다.
 * 값이 `['storage','usage']` 였던 것도 여기서 바꿨다(이 훅은 이제 용량만 세지 않는다).
 *
 * ⚠️ **타일 넷이 이 한 쿼리에 묶여 있다** — 네 칸이 한꺼번에 스켈레톤에서 풀린다.
 * 한 요청이라 금방 풀리지만, 칸마다 스켈레톤을 두는 이유는 그대로다.
 */
export const useTreeStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: treeStatsKeys.summary,
    queryFn: getTreeStats,
    enabled: Boolean(accessToken),
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: false,
  });
};
