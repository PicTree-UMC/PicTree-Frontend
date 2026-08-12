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
 * **저장소에 이 함수는 여기 하나뿐이다.** 한때 feature 별 `lib/` 에 셋이 더 있었고, 그중
 * `auth/lib/apiError.ts` 만 2번 갈래를 빠뜨려 **즐겨찾기·약관·탈퇴에서 서버 문구가 통째로
 * 사라졌다**(이슈 #307). 값이 같은 복사본은 이렇게 한쪽만 조용히 뒤처진다 — 그래서 새로
 * 만들지 말고 **여기로 온다.**
 *
 * ⚠️ 도메인이 상태 코드를 자기 문구로 가로채는 것은 별개이고 정상이다
 * (`favoriteError` 의 403·404, `termsError`). 그것들도 마지막에는 이 함수로 떨어진다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const body = error.response?.data as { message?: string } | undefined;

  return body?.message ?? fallback;
}
