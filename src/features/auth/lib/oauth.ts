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
