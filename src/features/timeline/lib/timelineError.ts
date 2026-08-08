import { isAxiosError } from "axios";

/**
 * 실패 응답에서 백엔드 메시지를 꺼낸다.
 *
 * axios 는 2xx 가 아니면 예외를 던지므로 응답 본문은 `error.response.data` 에 있다.
 * 이걸 안 쓰면 화면에 axios 기본 문구("Request failed with status code 404")가
 * 그대로 노출된다.
 *
 * 종전엔 명세서 형태(`{ resultType, error: { message } }`)와 서버 형태를 둘 다 읽었다.
 * 2026-08-08 스웨거 대조에서 **서버는 아래 한 형태뿐**임이 확인돼 명세서 쪽 갈래를 지웠다.
 *   `{ success: false, code, message }`
 */
export function getTimelineErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    // 2xx 로 내려온 실패 응답을 api 레이어가 직접 던진 경우 — 이미 서버 메시지를 담고 있다.
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const body = error.response?.data as { message?: string } | undefined;

  return body?.message ?? fallback;
}
