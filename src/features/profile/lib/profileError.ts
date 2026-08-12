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

/*
  `getApiErrorMessage` 는 `shared/lib/apiError.ts` 로 옮겼다(이슈 #307).

  한때 "합치지 않는 이유는 이쪽만 비-axios 예외를 처리하기 때문이고, 그 갈래를 auth 로
  옮기면 로그인 화면이 안 쓰는 분기를 떠안는다" 고 적혀 있었다. **그 전제가 무너졌다** —
  이슈 #290 이 API 레이어 22곳에 `unwrapApiResponse` 를 붙이면서 비-axios 예외는
  특정 화면의 사정이 아니라 **모든 도메인의 기본 실패 형태**가 됐다.

  여기 남은 둘은 프로필 고유다 — 상태 코드를 **행동 기준으로 분류**하는 일이라
  문구를 꺼내는 일과 층이 다르다.
*/
