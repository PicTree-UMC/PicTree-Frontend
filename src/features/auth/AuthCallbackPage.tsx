import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components';
import { socialLogin } from './api/authApi';
import { clearLogoutRequested } from './lib/logoutFlag';
import {
  clearSavedOAuthProvider,
  getOAuthRedirectUri,
  getSavedOAuthProvider,
} from './lib/oauth';
import { useAuthStore } from './store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasRequestedRef = useRef(false);

  const authorizationCode = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (hasRequestedRef.current || !authorizationCode) {
      return;
    }

    const provider = getSavedOAuthProvider();

    if (!provider) {
      showToast('소셜 로그인 정보를 찾을 수 없습니다.', 'error', { placement: 'top' });
      navigate(ROUTES.auth, { replace: true });
      return;
    }

    hasRequestedRef.current = true;

    socialLogin({
      provider,
      authorizationCode,
      redirectUri: getOAuthRedirectUri(),
    })
      .then((response) => {
        if (!response.success) {
          showToast(response.message, 'error', { placement: 'top' });
          navigate(ROUTES.auth, { replace: true });
          return;
        }

        setAuth(response.data);
        clearSavedOAuthProvider();
        clearLogoutRequested(); // 새 세션이 생겼으니 차단 해제 (리다이렉트로 진입한 경우 대비)

        if (response.data.needTermsAgreement) {
          navigate(`${ROUTES.auth}?step=terms`, { replace: true });
          return;
        }

        navigate(ROUTES.home, { replace: true });
      })
      .catch(() => {
        showToast('소셜 로그인에 실패했습니다.', 'error', { placement: 'top' });
        navigate(ROUTES.auth, { replace: true });
      });
  }, [authorizationCode, navigate, setAuth, showToast]);

  if (error || !authorizationCode) {
    return <Navigate to={ROUTES.auth} replace />;
  }

  return (
    // min-h-full: 뷰포트 단위를 아는 곳은 AppShell 하나다. 여기서 100vh 를 쓰면
    // 주소창이 떠 있을 때 셸 컬럼(h-dvh)을 넘긴다. 가드들의 '확인 중' 화면과 같은 규칙.
    <main className="flex min-h-full items-center justify-center bg-[#FFFCEF] px-6 text-[#2C3930]">
      <p className="font-['KOROAD'] text-[1rem] font-bold">로그인 처리 중입니다.</p>
    </main>
  );
}
