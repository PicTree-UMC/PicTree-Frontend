import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type { MyProfile } from '../types/user';

export async function getMyProfile(accessToken: string) {
  const { data } = await httpClient.get<ApiResponse<MyProfile>>('/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}
