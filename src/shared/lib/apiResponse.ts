import type { ApiResponse } from '../types/api';

/**
 * 공통 응답 래퍼를 벗겨 `data` 만 돌려준다. 실패면 던진다.
 *
 * **2xx 로 내려온 실패 응답을 걸러내는 자리다.** 서버는 실패를 항상 4xx/5xx 로
 * 주지 않는다 — 공통 래퍼 규약상 200 에 `success: false` 가 실릴 수 있고, 그때는
 * axios 가 예외를 던지지 않으므로 여기서 던지지 않으면 빈 `data` 가 화면까지 간다.
 *
 * 던지는 메시지는 **서버가 준 `message` 를 우선**한다. 서버 문구가 사용자에게
 * 가장 정확하기 때문이다(예: "이미 탈퇴한 계정입니다"). `fallbackMessage` 는
 * 서버가 문구를 비워 보냈을 때만 쓰인다.
 *
 * ⚠️ **사용자에게 보여줄 문구를 `fallbackMessage` 로 넘기지 말 것.** 표시용 대체
 * 문구는 호출부의 `getApiErrorMessage(error, '...')` 가 이미 맡고 있고, 그쪽이
 * 화면 맥락을 안다. 여기에 문구를 주면 오히려 그 구체적인 문구를 가린다.
 * 디버깅용 식별자(어느 요청이 비었는지)가 필요할 때만 넘긴다.
 */
export function unwrapApiResponse<T>(
  response: ApiResponse<T>,
  fallbackMessage?: string,
): T {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
}
