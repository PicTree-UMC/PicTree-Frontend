import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/constants/routes';
import { markLogoutRequested } from '../lib/logoutFlag';
import { useAuthStore } from '../store/authStore';

/**
 * 로컬 세션을 비우고 로그인 화면으로 보낸다.
 *
 * 로그아웃과 회원 탈퇴가 똑같이 필요로 하는 절차다. 순서가 중요해서 한곳에 모아 둔다
 * — `markLogoutRequested()` 가 `navigate` 보다 먼저 서야 라우트 가드가 refresh 쿠키로
 * 곧바로 재로그인시키는 일을 막을 수 있다 (로그아웃에서 실제로 났던 문제).
 */
export const useClearSession = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  /** 뒤로가기로 돌아오지 못하게 replace 로 이동한다. */
  return () => {
    markLogoutRequested(); // 가드의 자동 재발급 차단 — navigate 보다 먼저
    clearAuth(); // accessToken + localStorage 제거
    queryClient.clear(); // 이전 계정의 서버 데이터가 다음 로그인에 남지 않도록
    navigate(ROUTES.auth, { replace: true });
  };
};
