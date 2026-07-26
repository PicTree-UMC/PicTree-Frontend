import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';
import { logout } from '../api/authApi';
import { getApiErrorMessage } from '../lib/apiError';
import { markLogoutRequested } from '../lib/logoutFlag';
import { useAuthStore } from '../store/authStore';

/**
 * 로그아웃 mutation 훅. `POST /auth/logout` (Authorization: Bearer <Access Token>)
 *
 * 서버가 Refresh Token 을 폐기하고 `refreshToken` 쿠키를 만료시킨다(`Max-Age=0`).
 * 쿠키는 HttpOnly 라 JS 로 지울 수 없으므로 이 요청이 쿠키를 없애는 유일한 수단이다
 * — `httpClient` 의 `withCredentials: true` 가 반드시 유지되어야 한다.
 *
 * 요청 성패와 무관하게 클라이언트 상태는 항상 비운다. 로그아웃을 누른 사용자를
 * 로그인된 화면에 붙잡아 두는 편이 더 나쁘기 때문이다. 다만 서버 폐기가 실패하면
 * refresh 쿠키가 살아남아 인증 가드가 곧바로 재로그인시켜 버리므로,
 * `markLogoutRequested()` 로 자동 재발급 자체를 막는다.
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  /** 로컬 세션 정리 후 로그인 화면으로. 뒤로가기로 돌아오지 못하게 replace. */
  const clearSession = () => {
    markLogoutRequested(); // 가드의 자동 재발급 차단 — navigate 보다 먼저 서야 한다
    clearAuth(); // accessToken + localStorage 제거
    queryClient.clear(); // 이전 계정의 서버 데이터가 다음 로그인에 남지 않도록
    navigate(ROUTES.auth, { replace: true });
  };

  return useMutation({
    mutationFn: () => logout(accessToken ?? ''),
    onSuccess: () => {
      clearSession();
      showToast('로그아웃되었습니다.', 'success');
    },
    onError: (error) => {
      clearSession();

      /**
       * 성공이라고 말하지 않는다.
       *
       * 401 이라고 해서 세션이 끝난 것은 아니다 — access token 만 만료되고 refresh
       * token 은 유효할 수 있으며, 그러면 서버에는 세션이 그대로 남는다. 403·500·
       * 네트워크 오류도 마찬가지다. 로컬은 정리됐지만 서버 폐기는 보장할 수 없으므로
       * 사실대로 알린다.
       */
      showToast(
        getApiErrorMessage(error, '로그아웃 처리 중 문제가 발생했습니다.'),
        'error',
      );
    },
  });
};
