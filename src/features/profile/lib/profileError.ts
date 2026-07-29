import { isAxiosError } from 'axios';

/**
 * 내 정보 조회 실패를 사용자가 취할 수 있는 행동 기준으로 분류한다.
 *
 * 명세서가 401·403·404·500 을 나눠 정의한 이유는 각각 대응이 다르기 때문이다.
 * 전부 "다시 시도" 로 묶으면 영영 성공하지 않을 요청을 사용자가 반복하게 된다.
 */
export type ProfileErrorKind =
  /** 401 — 토큰이 무효. 재시도해도 소용없고 로그인부터 다시 해야 한다. */
  | 'session-expired'
  /** 403 정지 계정 · 404 없는 계정. 재시도 대상이 아니며 사유를 알려야 한다. */
  | 'account-unavailable'
  /** 500 · 네트워크 오류 등. 이 경우에만 재시도가 의미 있다. */
  | 'temporary';

export function getProfileErrorKind(error: unknown): ProfileErrorKind {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  if (status === 401) {
    return 'session-expired';
  }

  if (status === 403 || status === 404) {
    return 'account-unavailable';
  }

  return 'temporary';
}

/**
 * 4xx 인지. 같은 요청을 다시 보내도 결과가 바뀌지 않는 부류다.
 * 재시도(`retry`)뿐 아니라 창 포커스 재조회(`refetchOnWindowFocus`)도 막아야 한다
 * — 안 그러면 탭을 옮길 때마다 실패할 요청이 계속 나간다.
 */
export function isClientError(error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  return status !== undefined && status >= 400 && status < 500;
}

/**
 * 실패 응답에서 백엔드 메시지를 꺼낸다.
 *
 * axios 는 2xx 가 아니면 예외를 던지므로 응답 본문은 `error.response.data` 에 있다.
 *
 * ⚠️ 명세서와 서버 구현의 래퍼 형식이 다르다.
 *   - 명세서: `{ resultType: 'FAIL', error: { code, message }, ... }`
 *   - 서버(main): `{ success: false, code, message }`
 * 어느 쪽이 확정되든 화면이 깨지지 않도록 두 형태를 모두 읽는다.
 *
 * ⚠️ PR #45(로그아웃)의 `features/auth/lib/apiError.ts` 에 같은 함수가 있다.
 *    #45 가 머지되면 그쪽으로 합치고 이 함수는 지운다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    // 2xx 로 내려온 실패 응답을 훅에서 직접 던진 경우 — 이미 서버 메시지를 담고 있다.
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const body = error.response?.data as
    | { message?: string; error?: { message?: string } }
    | undefined;

  return body?.error?.message ?? body?.message ?? fallback;
}
