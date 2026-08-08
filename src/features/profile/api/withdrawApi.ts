import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';

/**
 * 회원 탈퇴. `DELETE /users/me`
 *
 * 내 정보 조회·수정(`GET`/`PATCH /users/me`)은 별도 브랜치에서 `userApi.ts` 로
 * 작업 중이라 파일을 나눠 둔다. 두 작업이 합쳐지면 한 파일로 모으면 된다.
 *
 * 서버는 계정을 물리적으로 지우지 않고 `status` 를 `WITHDRAWN` 으로 바꾼 뒤
 * refresh 토큰 쿠키를 만료시킨다. 쿠키는 HttpOnly 라 JS 로 지울 수 없으므로
 * 이 요청이 쿠키를 없애는 유일한 수단이다 — `withCredentials: true` 가 필요하다.
 *
 * 실패 코드는 두 가지가 의미를 가진다:
 * - `USER_ALREADY_WITHDRAWN` — 이미 탈퇴한 계정
 * - `USER_UNAVAILABLE` — 정지 등으로 ACTIVE 가 아닌 계정
 */
export async function withdrawMe() {
  const { data } = await httpClient.delete<ApiResponse<null>>('/users/me');

  return data;
}
