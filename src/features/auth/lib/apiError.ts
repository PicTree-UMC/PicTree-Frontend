import { isAxiosError } from 'axios';

/**
 * 실패 응답에서 백엔드 메시지를 꺼낸다.
 *
 * axios 는 2xx 가 아니면 예외를 던지므로 응답 본문은 `error.response.data` 에 있다.
 *
 * 종전엔 명세서 형태(`{ resultType, error: { message } }`)와 서버 형태를 둘 다 읽었다.
 * 2026-08-08 스웨거(`/swagger-json`, 서버 생성 문서) 대조에서 **서버는 아래 한 형태뿐**임이
 * 확인돼 명세서 쪽 갈래를 지웠다 — 그 형태는 실제로 내려온 적이 없다.
 *   `{ success: false, code, message }`
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const body = error.response?.data as { message?: string } | undefined;

  return body?.message ?? fallback;
}
