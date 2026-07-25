import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';
import { logout } from '../api/authApi';
import { getApiErrorMessage, isSessionEndedError } from '../lib/apiError';
import { useAuthStore } from '../store/authStore';

const LOGOUT_SUCCESS_MESSAGE = '로그아웃되었습니다.';

/**
 * 로그아웃 mutation 훅. `POST /auth/logout` (Authorization: Bearer <Access Token>)
 *
 * 서버가 Refresh Token 을 폐기하고 `refreshToken` 쿠키를 만료시킨다(`Max-Age=0`).
 * 쿠키는 HttpOnly 라 JS 로 지울 수 없으므로 이 요청이 쿠키를 없애는 유일한 수단이다
 * — `httpClient` 의 `withCredentials: true` 가 반드시 유지되어야 한다.
 *
 * 성공·실패와 무관하게 클라이언트 상태는 항상 비운다. 401/403 이면 세션은 이미
 * 죽은 것이라 남겨둘 이유가 없고, 500 이라 해도 로그아웃을 누른 사용자를
 * 로그인된 화면에 붙잡아 두는 편이 더 나쁘다.
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  /** 로컬 세션 정리 후 로그인 화면으로. 뒤로가기로 돌아오지 못하게 replace. */
  const clearSession = () => {
    clearAuth(); // accessToken + localStorage 제거
    queryClient.clear(); // 이전 계정의 서버 데이터가 다음 로그인에 남지 않도록
    navigate(ROUTES.auth, { replace: true });
  };

  return useMutation({
    mutationFn: () => logout(accessToken ?? ''),
    onSuccess: () => {
      clearSession();
      showToast(LOGOUT_SUCCESS_MESSAGE, 'success');
    },
    onError: (error) => {
      clearSession();

      // 401·403 은 세션이 이미 끝났다는 뜻 → 사용자 입장에선 정상 로그아웃
      if (isSessionEndedError(error)) {
        showToast(LOGOUT_SUCCESS_MESSAGE, 'success');
        return;
      }

      // 500·네트워크 오류. 서버의 Refresh Token 쿠키가 남아 있을 수 있어
      // 성공이라고 말하지 않는다 (다음 방문에 자동 재로그인될 여지).
      showToast(
        getApiErrorMessage(error, '로그아웃 처리 중 문제가 발생했습니다.'),
        'error',
      );
    },
  });
};
