import { useMutation } from '@tanstack/react-query';

import { useClearSession } from '@/features/auth/hooks/useClearSession';
import { getApiErrorMessage } from '@/features/auth/lib/apiError';
import { useToast } from '@/shared/components';
import { withdrawMe } from '../api/withdrawApi';

/**
 * 회원 탈퇴 mutation 훅. `DELETE /users/me`
 *
 * 성공하면 로그아웃과 똑같이 로컬 세션을 비우고 로그인 화면으로 보낸다.
 *
 * 로그아웃과 달리 실패하면 세션을 건드리지 않는다. 로그아웃은 "나가겠다" 는 의사가
 * 우선이라 실패해도 로컬을 비웠지만, 탈퇴는 서버에서 실제로 처리됐는지가 핵심이라
 * 실패한 채로 내보내면 사용자가 탈퇴됐다고 오해한다. 사유만 알리고 화면에 남긴다.
 */
export const useWithdraw = () => {
  const { showToast } = useToast();
  const clearSession = useClearSession();

  return useMutation({
    mutationFn: async () => {
      const response = await withdrawMe();

      // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
      if (response.resultType === 'FAIL') {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: () => {
      clearSession();
      showToast('탈퇴가 완료되었습니다.', 'success');
    },

    onError: (error) => {
      // 이미 탈퇴한 계정·정지 계정 등 서버가 준 사유를 그대로 보여준다
      showToast(
        getApiErrorMessage(error, '탈퇴 처리 중 문제가 발생했습니다.'),
        'error',
      );
    },
  });
};
