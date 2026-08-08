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
 *
 * @param enabled 계산을 **시작할지**. 기본 `true`.
 *
 * ⚠️ 이 스위치는 있어도 되는 최적화가 아니다. 용량 카드가 마이페이지로 내려오면서
 * 이 계산이 **탭 하나에 딸리게 됐다** — 화면을 열자마자 돌면 나무 수만큼 요청이
 * 나가고, 사진을 찍거나 지울 때마다 캐시가 깨져 다음 진입에서 또 돈다. 카드는 접힌
 * 화면 아래에 있으니, 거기까지 내려온 사람에게만 값을 센다(`ProfileSummary` 가
 * `useInView` 로 넘긴다). `false` 로 시작해도 캐시에 값이 있으면 그건 그대로 쓴다.
 */
export const useStorageUsage = (enabled = true) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: storageKeys.usage,
    queryFn: getStorageUsedBytes,
    enabled: Boolean(accessToken) && enabled,
    staleTime: Infinity,
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: false,
  });
};
