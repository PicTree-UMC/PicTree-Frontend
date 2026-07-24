import { httpClient } from '../../../shared/lib/httpClient';
import type {
  ApiResponse,
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

export async function refreshAccessToken() {
  const { data } = await httpClient.post<ApiResponse<RefreshTokenData>>('/auth/refresh');

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
