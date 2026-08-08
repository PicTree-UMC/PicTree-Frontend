import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/shared/components';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateMyProfile } from '../api/userApi';
import { getApiErrorMessage } from '../lib/profileError';
import type { MyProfile, UpdateMyProfileRequest } from '../types/user';
import { userKeys } from './useMyProfile';

/**
 * 내 정보 수정 mutation 훅. `PATCH /users/me`
 *
 * 낙관적 업데이트를 쓴다. 알림 토글처럼 즉각 반응해야 하는 UI 가 응답을 기다리면
 * 눌러도 안 움직이는 것처럼 보이기 때문이다. 실패하면 이전 값으로 되돌린다.
 *
 * 응답 `data` 에는 `createdAt` 이 없으므로(조회 응답과 다름) 캐시를 통째로
 * 갈아끼우지 않고 기존 값 위에 병합한다.
 */
export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (payload: UpdateMyProfileRequest) => {
      const response = await updateMyProfile(accessToken ?? '', payload);

      return unwrapApiResponse(response);
    },

    onMutate: async (payload) => {
      // 진행 중인 조회가 끝나면서 낙관적 값을 덮어쓰지 않도록 먼저 취소한다.
      await queryClient.cancelQueries({ queryKey: userKeys.me });

      const previous = queryClient.getQueryData<MyProfile>(userKeys.me);

      if (previous) {
        queryClient.setQueryData<MyProfile>(userKeys.me, { ...previous, ...payload });
      }

      return { previous };
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<MyProfile>(userKeys.me, (previous) =>
        previous ? { ...previous, ...updated } : previous,
      );
    },

    onError: (error, _payload, context) => {
      // 낙관적으로 바꿔둔 값 되돌리기
      if (context?.previous) {
        queryClient.setQueryData<MyProfile>(userKeys.me, context.previous);
      }

      showToast(getApiErrorMessage(error, '변경에 실패했습니다.'), 'error');
    },
  });
};
