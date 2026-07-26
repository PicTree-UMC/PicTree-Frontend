import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { ROUTES } from '../../../shared/constants/routes';
import { refreshAccessToken } from '../api/authApi';
import { isLogoutRequested } from '../lib/logoutFlag';
import { useAuthStore } from '../store/authStore';

type AuthCheckStatus = 'checking' | 'authenticated' | 'unauthenticated';

export function PublicOnlyRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [status, setStatus] = useState<AuthCheckStatus>(
    accessToken ? 'authenticated' : 'checking',
  );
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (accessToken) {
      setStatus('authenticated');
      return;
    }

    if (hasRequestedRef.current) {
      return;
    }

    // 방금 로그아웃한 사용자를 refresh 쿠키로 되돌려보내지 않는다.
    // (서버 폐기가 실패해 쿠키가 남아 있을 수 있다)
    if (isLogoutRequested()) {
      setStatus('unauthenticated');
      return;
    }

    hasRequestedRef.current = true;

    refreshAccessToken()
      .then((response) => {
        if (response.resultType === 'FAIL') {
          clearAuth();
          setStatus('unauthenticated');
          return;
        }

        setAccessToken(response.data.accessToken, response.data.expiresIn);
        setStatus('authenticated');
      })
      .catch(() => {
        clearAuth();
        setStatus('unauthenticated');
      });
  }, [accessToken, clearAuth, setAccessToken]);

  if (status === 'checking') {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#FFFCEF] px-6 text-[#2C3930]">
        <p className="font-['KOROAD'] text-[1rem] font-bold">로그인 상태를 확인 중입니다.</p>
      </main>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
