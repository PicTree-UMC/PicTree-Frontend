import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '../types/auth';
import type { Term } from '../types/terms';

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

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}
