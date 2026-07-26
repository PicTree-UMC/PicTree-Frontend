import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '../store/authStore';

/**
 * 세션 만료(401)를 감지하면 로컬 토큰을 비우고 로그인 화면으로 보낸다.
 *
 * 죽은 토큰을 들고 화면에 남아 있으면 사용자는 영영 성공하지 않을 "다시 시도" 만
 * 반복하게 된다.
 *
 * 로그아웃과 달리 재발급 차단 플래그는 세우지 않는다. 사용자가 로그아웃한 것이
 * 아니라 access token 만 만료된 상황이라, refresh token 이 살아 있다면 `/auth` 의
 * 가드가 재발급해 자연스럽게 로그인 상태로 돌아가는 편이 맞다.
 */
export const useSessionExpiredRedirect = (isSessionExpired: boolean) => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!isSessionExpired) {
      return;
    }

    clearAuth();
    navigate(ROUTES.auth, { replace: true });
  }, [isSessionExpired, clearAuth, navigate]);
};
