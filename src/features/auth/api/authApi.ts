import { httpClient } from '../../../shared/lib/httpClient';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';
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

/**
 * 로그아웃. **이 파일에서 유일하게 언랩까지 하는 함수다.**
 *
 * 위 둘(`socialLogin`·`refreshAccessToken`)이 래퍼를 그대로 돌려주는 건 게으름이 아니라
 * 호출부가 **던지는 것이 아니라 갈라지기**를 원하기 때문이다 — `ProtectedRoute`·
 * `PublicOnlyRoute`·`AuthCallbackPage` 가 `if (!response.success)` 로 받아 로그인 화면으로
 * 보낼지 말지를 정한다. 거기서 예외가 날아오면 그 판단을 `catch` 로 옮겨 적어야 한다.
 *
 * 로그아웃은 반대다. 소비자가 `useLogout` **하나뿐이고 그건 mutation** 이라, 실패는
 * `onError` 로 가는 게 자연스럽다. 언랩이 없던 동안 200 + `success:false` 가 `onSuccess`
 * 로 새어 **실패해도 "로그아웃되었습니다" 가 떴다**(이슈 #309).
 */
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

  return unwrapApiResponse(data);
}
