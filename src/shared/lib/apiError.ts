import { isAxiosError } from 'axios';

/**
 * 실패에서 사용자에게 보여줄 문구를 꺼낸다. 실패가 오는 길이 **두 갈래**라 둘 다 본다.
 *
 * 1. **4xx/5xx** — axios 가 예외를 던지고 응답 본문은 `error.response.data` 에 있다
 *    (`{ success: false, code, message }`). 이걸 안 읽으면 화면에 axios 기본 문구
 *    ("Request failed with status code 400")가 그대로 노출된다.
 * 2. **200 인데 `success: false`** — axios 는 조용히 통과시키고 `unwrapApiResponse` 가
 *    `Error(서버 message)` 로 바꿔 던진다. 그래서 axios 예외가 아닌 것도 메시지를 갖는다.
 *
 * 두 번째 갈래를 빠뜨리면 서버가 준 사유가 통째로 사라지고 fallback 만 남는다.
 *
 * ⚠️ **feature 별 `lib/` 에 같은 함수가 셋 있다** — `auth/lib/apiError.ts`(1번만),
 * `profile/lib/profileError.ts`·`timeline/lib/timelineError.ts`(둘 다, 구현이 같다).
 * 여기가 있어야 할 자리다(`unwrapApiResponse` 의 주석이 이미 이 이름을 호출부 규약으로
 * 전제하고 있다). 기존 셋을 이걸로 모으는 건 별건 — 이 파일이 그 착지점이다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const body = error.response?.data as { message?: string } | undefined;

  return body?.message ?? fallback;
}
