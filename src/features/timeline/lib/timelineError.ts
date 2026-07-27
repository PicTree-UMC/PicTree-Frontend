import { isAxiosError } from "axios";

/**
 * 실패 응답에서 백엔드 메시지를 꺼낸다.
 *
 * axios 는 2xx 가 아니면 예외를 던지므로 응답 본문은 `error.response.data` 에 있다.
 * 이걸 안 쓰면 화면에 axios 기본 문구("Request failed with status code 404")가
 * 그대로 노출된다.
 *
 * ⚠️ 명세서와 서버 구현의 래퍼 형식이 다르다.
 *   - 명세서: `{ resultType: 'FAIL', error: { code, message }, ... }`
 *   - 서버(main): `{ success: false, code, message }`
 * 어느 쪽이 확정되든 화면이 깨지지 않도록 두 형태를 모두 읽는다.
 */
export function getTimelineErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    // 2xx 로 내려온 실패 응답을 api 레이어가 직접 던진 경우 — 이미 서버 메시지를 담고 있다.
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const body = error.response?.data as
    | { message?: string; error?: { message?: string } }
    | undefined;

  return body?.error?.message ?? body?.message ?? fallback;
}
