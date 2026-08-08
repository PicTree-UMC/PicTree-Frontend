import { httpClient } from '../../../shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type {
  RefreshTokenData,
  SocialLoginData,
  SocialLoginRequest,
} from '../types/auth';

export async function socialLogin(payload: SocialLoginRequest) {
  const { data } = await httpClient.post<ApiResponse<SocialLoginData>>(
    '/auth/social-login',
    payload,
  );

  return data;
}

// 경로는 /auth/refresh 가 아니라 /auth/token/refresh 다.
// 틀린 경로라 404 가 나면서 세션 복원이 조용히 실패하고 있었다 (로컬은 localStorage 가
// 비어 있어 항상 이 경로를 타므로 로그인 화면으로 튕겼다).
export async function refreshAccessToken() {
  const { data } = await httpClient.post<ApiResponse<RefreshTokenData>>('/auth/token/refresh');

  return data;
}

export async function logout(accessToken: string) {
  const { data } = await httpClient.post<ApiResponse<null>>(
    '/auth/logout',
    null,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return data;
}
