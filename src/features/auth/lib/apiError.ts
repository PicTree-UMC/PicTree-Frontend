import { isAxiosError } from 'axios';

/**
 * 실패 응답에서 백엔드 메시지를 꺼낸다.
 *
 * axios 는 2xx 가 아니면 예외를 던지므로 응답 본문은 `error.response.data` 에 있다.
 *
 * ⚠️ 현재 명세서와 서버 구현의 래퍼 형식이 다르다 (README/PR 참고).
 *   - 명세서: `{ resultType: 'FAIL', error: { code, message }, success: null, data: null }`
 *   - 서버(main): `{ success: false, code, message }`
 * 어느 쪽이 확정되든 화면이 깨지지 않도록 두 형태를 모두 읽는다.
 * 래퍼가 통일되면 이 함수는 한 줄로 줄어든다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const body = error.response?.data as
    | { message?: string; error?: { message?: string } }
    | undefined;

  return body?.error?.message ?? body?.message ?? fallback;
}
