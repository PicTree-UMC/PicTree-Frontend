import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type {
  MyProfile,
  UpdateMyProfileRequest,
  UpdatedMyProfile,
} from '../types/user';

export async function getMyProfile(accessToken: string) {
  const { data } = await httpClient.get<ApiResponse<MyProfile>>('/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}

/**
 * 내 정보 수정. `PATCH /users/me`
 *
 * 보낸 필드만 반영되는 부분 수정이다. 빈 객체를 보내면 400 이 오므로
 * 호출부가 최소 한 필드는 채워야 한다.
 */
export async function updateMyProfile(
  accessToken: string,
  payload: UpdateMyProfileRequest,
) {
  const { data } = await httpClient.patch<ApiResponse<UpdatedMyProfile>>(
    '/users/me',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return data;
}
