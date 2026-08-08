import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getStorageStats } from '../api/storageApi';
import { isClientError } from '../lib/profileError';

export const storageKeys = {
  usage: ['storage', 'usage'] as const,
};

/**
 * 사진 저장 통계 조회 훅 — 사용량(byte) · 나무 그루 수 · 사진 장수.
 *
 * 서버에 합계 API 가 없어 `storageApi` 가 나무 수만큼 요청을 돌려 더한다. 그래서
 * **`staleTime: Infinity`** 다 — 화면을 열 때마다 다시 세면 사진이 그대로인데도
 * 매번 그 왕복을 치른다.
 *
 * 대신 값이 실제로 변하는 순간에만 무효화한다(`storageKeys.usage`):
 *  - 사진을 올릴 때 — 나무 기록 생성
 *  - 사진이 사라질 때 — 기록 삭제, 지도에서 나무 삭제
 *
 * 이 세 곳 말고 사진 수를 바꾸는 경로가 생기면 거기서도 무효화해야 한다. 안 하면
 * 화면의 값이 실제와 조용히 어긋난 채로 남는다.
 *
 * ⚠️ **키 이름은 `usage` 그대로다.** 세 값이 같은 순회에서 나오는 한 캐시는 하나이고,
 * 위 세 무효화 지점이 이 키를 가리키고 있다. 이름을 바꾸면 그 셋을 같이 고쳐야 한다.
 *
 * ⚠️⚠️ **`enabled` 스위치를 뺐다.** 요약이 마이페이지 첫 섹션으로 올라가면서
 * `useInView` 로 미룰 수가 없어졌다 — 열자마자 보이는 자리라 게이트가 즉시 통과한다.
 * 그래서 **마이페이지에 들어올 때마다 이 순회가 돈다**(나무 34그루면 35요청).
 * `staleTime: Infinity` 가 한 세션 안에서는 한 번으로 막아 주지만, 새로고침하거나
 * 위 세 지점에서 캐시가 깨지면 다음 진입에서 또 돈다.
 *
 * 진짜 해법은 백엔드에 요청해 둔 `SUM(file_size)` 한 방짜리 API 다(`storageApi` 주석).
 * 그 전에 진입이 무겁게 느껴지면, 스위치를 되살리는 게 아니라 **나무 목록(요청 1~2회)과
 * 사진 순회를 두 쿼리로 갈라** 그루 수를 먼저 채우는 쪽이 맞다.
 *
 * ⚠️ **타일 넷이 이 한 값에 묶여 있다.** 값이 하나씩 도착하는 게 아니라 순회가 다
 * 끝나야 오므로, 네 칸이 한꺼번에 스켈레톤에서 풀린다. 칸마다 스켈레톤을 두는 이유다.
 */
export const useStorageStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: storageKeys.usage,
    queryFn: getStorageStats,
    enabled: Boolean(accessToken),
    staleTime: Infinity,
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: false,
  });
};
