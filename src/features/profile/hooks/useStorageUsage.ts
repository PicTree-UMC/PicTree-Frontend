import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getStorageUsedBytes } from '../api/storageApi';
import { isClientError } from '../lib/profileError';

export const storageKeys = {
  usage: ['storage', 'usage'] as const,
};

/**
 * 사진 저장 사용량(byte) 조회 훅.
 *
 * 서버에 합계 API 가 없어 `storageApi` 가 나무 수만큼 요청을 돌려 더한다. 그래서
 * **`staleTime: Infinity`** 다 — 구독 관리 화면을 열 때마다 다시 세면 사진이 그대로인데도
 * 매번 그 왕복을 치른다.
 *
 * 대신 용량이 실제로 변하는 순간에만 무효화한다(`storageKeys.usage`):
 *  - 사진을 올릴 때 — 나무 기록 생성
 *  - 사진이 사라질 때 — 기록 삭제, 지도에서 나무 삭제
 *
 * 이 세 곳 말고 사진 수를 바꾸는 경로가 생기면 거기서도 무효화해야 한다. 안 하면
 * 화면의 용량이 실제와 조용히 어긋난 채로 남는다.
 */
export const useStorageUsage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: storageKeys.usage,
    queryFn: getStorageUsedBytes,
    enabled: Boolean(accessToken),
    staleTime: Infinity,
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: false,
  });
};
