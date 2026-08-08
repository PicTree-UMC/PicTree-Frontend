import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getMyProfile } from '../api/userApi';
import { isClientError } from '../lib/profileError';

export const userKeys = {
  me: ['users', 'me'] as const,
};

export const useMyProfile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const response = await getMyProfile(accessToken ?? '');

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data;
    },
    enabled: Boolean(accessToken),
    /**
     * 4xx 는 재시도하지 않는다. 401(토큰 무효)·403(정지 계정)·404(사용자 없음)는
     * 같은 요청을 반복해도 결과가 바뀌지 않아 서버만 두드리게 된다.
     * 5xx·네트워크 오류는 queryClient 기본값(1회)을 그대로 쓴다.
     */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    /**
     * 위와 같은 이유로 창 포커스 재조회도 막는다. `retry` 만 막으면 탭을 옮겼다
     * 돌아올 때마다 403·404 요청이 새로 나간다 (검증 중 실제로 확인).
     */
    refetchOnWindowFocus: (query) => !isClientError(query.state.error),
  });
};
