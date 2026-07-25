import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components';
import { socialLogin } from './api/authApi';
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
        if (response.resultType === 'FAIL') {
          showToast(response.error.message, 'error', { placement: 'top' });
          navigate(ROUTES.auth, { replace: true });
          return;
        }

        setAuth(response.data);
        clearSavedOAuthProvider();

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
    <main className="flex min-h-screen items-center justify-center bg-[#FFFDF4] px-6 text-[#2C3930]">
      <p className="font-['KOROAD'] text-[1rem] font-bold">로그인 처리 중입니다.</p>
    </main>
  );
}
