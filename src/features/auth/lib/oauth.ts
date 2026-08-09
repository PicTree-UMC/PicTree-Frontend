import { clearLogoutRequested } from './logoutFlag';
import type { SocialLoginProvider } from '../types/auth';

const OAUTH_PROVIDER_STORAGE_KEY = 'pictree.oauthProvider';

export function getOAuthRedirectUri() {
  return import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;
}

export function saveOAuthProvider(provider: SocialLoginProvider) {
  sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, provider);
}

export function getSavedOAuthProvider() {
  const provider = sessionStorage.getItem(OAUTH_PROVIDER_STORAGE_KEY);

  if (provider === 'KAKAO' || provider === 'GOOGLE') {
    return provider;
  }

  return null;
}

export function clearSavedOAuthProvider() {
  sessionStorage.removeItem(OAUTH_PROVIDER_STORAGE_KEY);
}

/**
 * 콜백 URL 의 `error` 파라미터를 사용자 문구로 옮긴다.
 *
 * 카카오·구글이 인가에 실패하면 코드 대신 `?error=...&error_description=...` 로 돌려보낸다.
 * **그 값은 provider 가 개발자에게 하는 말이라 화면에 그대로 못 쓴다** — 영문인 데다
 * `error_description` 은 `Invalid client_id` 처럼 설정 문제를 그대로 노출한다. 코드만
 * 보고 우리 문구로 옮기고, 원문은 호출부가 콘솔에 남긴다.
 *
 * ⚠️ `access_denied` 는 **실패가 아니라 사용자의 선택**이다(동의 화면에서 취소). 여기에
 * "실패했습니다" 를 띄우면 자기가 누른 결과를 오류로 되돌려받는다.
 *
 * 표준 코드는 OAuth 2.0 (RFC 6749 §4.1.2.1) 것이고 두 provider 가 같이 쓴다.
 */
export function getOAuthErrorMessage(error: string): string {
  switch (error) {
    case 'access_denied':
      return '로그인을 취소했어요.';
    case 'invalid_scope':
    case 'invalid_request':
    case 'unauthorized_client':
    case 'unsupported_response_type':
      return '소셜 로그인 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요.';
    case 'server_error':
    case 'temporarily_unavailable':
      return '소셜 로그인 서비스가 불안정해요. 잠시 후 다시 시도해 주세요.';
    default:
      return '소셜 로그인에 실패했습니다.';
  }
}

export function redirectToOAuth(provider: SocialLoginProvider) {
  saveOAuthProvider(provider);

  const redirectUri = getOAuthRedirectUri();

  if (provider === 'KAKAO') {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;

    if (!clientId) {
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
    });

    // 실제로 인증 페이지로 떠나는 시점에만 차단을 푼다.
    // (키 누락 등으로 위에서 throw 되면 플래그는 그대로 유지돼야 한다)
    clearLogoutRequested();
    window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params.toString()}`);
    return;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Client ID가 설정되지 않았습니다.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  clearLogoutRequested();
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
