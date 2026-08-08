import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { Term, TermsAgreementResult } from '../types/terms';

/**
 * 약관 목록 조회. `GET /terms`
 *
 * 인증이 필요 없다 — 백엔드 `TermsController` 에 `AccessTokenGuard` 가 없다.
 * 가입 전(토큰이 없는 시점) 동의 화면에서 부르므로 그래야 맞다.
 *
 * ⚠️ `data` 가 객체가 아니라 배열이다. 다른 목록 API(`items`·`content` 로 감싸는
 * 형태)와 달라 그대로 받는다.
 */
export async function getTerms(): Promise<Term[]> {
  const { data } = await httpClient.get<ApiResponse<Term[]>>('/terms');

  return unwrapApiResponse(data);
}

/**
 * 내 약관 동의 저장. `POST /users/me/terms-agreements`
 *
 * 목록 조회와 달리 인증이 필요하다 (`AccessTokenGuard`). 소셜 로그인으로 토큰을
 * 받은 뒤 동의 화면을 거치므로 이 시점에는 토큰이 있다.
 *
 * 필수 약관을 빠뜨리면 서버가 400 `TERMS400` 으로 막는다. 화면에서 이미 막고
 * 있지만 서버가 최종 판정을 한다 — 약관이 바뀌어 화면 목록이 낡았을 수 있다.
 *
 * 실패 코드: 400 `TERMS400`(필수 미동의), 403 `USER403`(이용 불가 계정),
 * 404 `TERMS404`(없는 약관).
 */
export async function agreeToTerms(
  agreedTermIds: number[],
): Promise<TermsAgreementResult> {
  const { data } = await httpClient.post<ApiResponse<TermsAgreementResult>>(
    '/users/me/terms-agreements',
    { agreedTermIds },
  );

  return unwrapApiResponse(data);
}
