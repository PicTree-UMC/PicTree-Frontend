const LOGOUT_REQUESTED_STORAGE_KEY = 'pictree.logoutRequested';

/**
 * "사용자가 로그아웃을 눌렀다" 는 명시적 표시.
 *
 * 로그아웃 후 `/auth` 로 보내면 인증 가드가 곧바로 재발급을 시도한다. 서버의
 * refresh 토큰 폐기가 실패했다면(401·403·500·네트워크 오류) 쿠키가 그대로 남아
 * 재발급이 성공하고, 방금 로그아웃한 사용자가 홈으로 되돌아간다.
 * 이 플래그가 서 있는 동안 가드들은 자동 재발급을 건너뛴다.
 *
 * 저장소로 `localStorage` 를 쓰는 이유:
 * - 라우터 state 는 새로고침하면 사라져 그 순간 자동 재발급이 다시 돈다.
 * - `sessionStorage` 는 탭 단위라, 새 탭을 열면 살아 있는 쿠키로 재로그인된다.
 * accessToken 과 같은 저장소를 써서 수명을 맞춘다.
 */
export const markLogoutRequested = () => {
  localStorage.setItem(LOGOUT_REQUESTED_STORAGE_KEY, 'true');
};

/** 사용자가 다시 로그인을 시작·완료하면 해제한다. */
export const clearLogoutRequested = () => {
  localStorage.removeItem(LOGOUT_REQUESTED_STORAGE_KEY);
};

export const isLogoutRequested = () =>
  localStorage.getItem(LOGOUT_REQUESTED_STORAGE_KEY) === 'true';
