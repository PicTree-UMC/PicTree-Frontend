import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components';
import { socialLogin } from './api/authApi';
import { getApiErrorMessage } from './lib/apiError';
import { clearLogoutRequested } from './lib/logoutFlag';
import {
  clearSavedOAuthProvider,
  getOAuthErrorMessage,
  getOAuthRedirectUri,
  getSavedOAuthProvider,
} from './lib/oauth';
import { useAuthStore } from './store/authStore';

/** 서버·provider 가 아무 말도 안 남겼을 때만 쓰는 문구. */
const SOCIAL_LOGIN_FALLBACK = '소셜 로그인에 실패했습니다.';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasRequestedRef = useRef(false);

  const hasReportedErrorRef = useRef(false);

  const authorizationCode = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

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
          // 200 에 실려 온 실패. 서버 문구가 비어 있을 때만 우리 문구로 메운다.
          showToast(response.message || SOCIAL_LOGIN_FALLBACK, 'error', { placement: 'top' });
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
      .catch((requestError) => {
        /*
          ⚠️ **여기서 서버가 준 사유가 버려지고 있었다**(이슈 #194). axios 는 2xx 가
          아니면 던지므로 실제 로그인 실패는 대부분 이 갈래로 온다 — 본문
          `{ success:false, code, message }` 를 그대로 들고서.

          가장 크게 어긋나던 건 **정지·탈퇴 계정**(`USER403 이용할 수 없는 계정입니다`)
          이다. 이유를 못 들으니 사용자는 될 때까지 다시 누르는 수밖에 없었다.
          같은 기능의 로그아웃·탈퇴는 이미 이 헬퍼를 쓰고 있었고 로그인만 빠져 있었다.
        */
        showToast(getApiErrorMessage(requestError, SOCIAL_LOGIN_FALLBACK), 'error', {
          placement: 'top',
        });
        navigate(ROUTES.auth, { replace: true });
      });
  }, [authorizationCode, navigate, setAuth, showToast]);

  /*
    provider 가 코드 대신 `?error=` 로 돌려보낸 경우 — 동의 화면에서 취소한 길이 대부분이다.
    종전에는 **말없이 로그인 화면으로 되돌리기만 했다.** 화면이 깜빡이고 제자리로 오니
    눌린 건지 실패한 건지 알 수가 없었다.

    토스트를 띄운 뒤 옮겨야 하므로 `<Navigate>` 대신 effect + `navigate()` 로 간다 —
    렌더 중에 토스트를 부르면 렌더 도중 상태 갱신이 된다.
  */
  useEffect(() => {
    /*
      ⚠️ 위 로그인 요청과 같은 이유로 ref 로 한 번만 돈다. StrictMode 가 개발에서 effect 를
      두 번 부르는데, 막지 않으면 같은 토스트가 두 장 겹친다(실제로 그렇게 떴다).
      `searchParams` 를 의존성에 넣지 않는 것도 같은 맥락 — 렌더마다 새 객체라 반복 실행의
      씨앗이다. 필요한 값은 위에서 문자열로 뽑아 뒀다.
    */
    if (!error || hasReportedErrorRef.current) return;
    hasReportedErrorRef.current = true;

    // provider 원문은 화면에 안 쓰지만(영문·설정 노출) 원인 추적에는 이게 유일한 단서다.
    console.error('[oauth] provider 인가 실패:', error, errorDescription);
    showToast(getOAuthErrorMessage(error), 'error', { placement: 'top' });
    navigate(ROUTES.auth, { replace: true });
  }, [error, errorDescription, navigate, showToast]);

  /*
    ⚠️ **`error` 는 여기서 빼야 한다.** 위 effect 가 토스트를 띄우고 직접 옮기는데
    `<Navigate>` 까지 걸어 두면 이동을 두 곳이 소유하게 되고, 그때는 effect 가 도는지가
    `<Navigate>`(자식) 의 effect 순서에 달린다 — 토스트가 뜰지 말지가 렌더 순서에 기대는
    코드가 된다. 이동은 한 곳만 한다.

    사유도 코드도 없는 경우만 여기서 조용히 되돌린다. 할 말이 없어서다.
  */
  if (!authorizationCode && !error) {
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
