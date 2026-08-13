/**
 * 로그인 화면(`WelcomeView`) 토스트 자리.
 *
 * 공용 기본값을 못 쓴다. `placement: 'top'`(safe + 9rem)은 **동선 보기 화면의 날짜 칩 줄**
 * 에 맞춘 실측값이라 헤더도 칩도 없는 이 화면에서는 근거가 없고, 실제로 새싹 일러스트
 * 한가운데에 앉아 글이 그림 위로 겹쳤다. 기본 하단(`.bottom-nav`)도 안 된다 — 그 값은
 * 탭바를 피하려고 둔 것인데 이 화면엔 탭바가 없고 대신 로그인 버튼 두 장이 있다.
 *
 * 그래서 **문구와 카카오 버튼 사이 빈칸의 정중앙**에 놓는다. 그 자리는 화면 높이마다
 * 달라지므로 상수가 아니라 `useWelcomeToastAnchor` 가 실측해 이 변수에 넣는다
 * (왜 상수로는 안 되는지는 그 훅 주석에 적어 뒀다).
 */
export const WELCOME_TOAST_CSS_VAR = '--welcome-toast-offset';

/**
 * 실측값이 아직 없을 때 쓰는 값.
 *
 * `WelcomeView` 가 뜨기 전에 토스트가 먼저 생길 수 있다 — 콜백 화면(`/auth/callback`)에서
 * 띄우고 `/auth` 로 옮기는 길이 그렇다. 그 찰나에 쓸 자리다. 아래에서부터 셸 여백
 * (`max(safe + 1.25rem, 2.5rem)`)과 버튼 두 장(`4.3125rem × 2 + 0.5rem`)을 지나 빈칸
 * 최소 높이의 절반(`4.625rem`)만큼 올라간 지점 — **빈칸은 이보다 좁아지지 않으므로**
 * 이 값이면 버튼에도 문구에도 걸치지 않는다. 곧 실측값이 들어와 정중앙으로 옮겨 앉는다.
 */
const WELCOME_TOAST_FALLBACK =
  'calc(max(env(safe-area-inset-bottom) + 1.25rem, 2.5rem) + 9.125rem + 4.625rem)';

/** 로그인 화면에서 토스트를 띄울 때 그대로 펼쳐 쓴다. */
export const WELCOME_TOAST_OPTIONS = {
  placement: 'bottom',
  offset: `var(${WELCOME_TOAST_CSS_VAR}, ${WELCOME_TOAST_FALLBACK})`,
} as const;
