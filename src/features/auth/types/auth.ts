export type AuthStep = 'social-login' | 'terms';

export type SocialLoginProvider = 'KAKAO' | 'GOOGLE';

export type SocialLoginRequest = {
  provider: SocialLoginProvider;
  authorizationCode: string;
  redirectUri: string;
};

export type TermId =
  | 'service'
  | 'privacy'
  | 'location'
  | 'push'
  | 'marketing';

/**
 * 요금제 코드. 서버 `subscription_plans.code` 를 그대로 받는다.
 *
 * 종전엔 `'FREE' | 'PREMIUM'` 이었는데 `'PREMIUM'` 은 **서버에 없는 코드다** — 유료가
 * 하나뿐이던 시절의 이름이 남아 있었다. 실제로는 유료가 셋이고(2026-08-08
 * `GET /subscription-plans` 실응답 기준: PLUS 2,900원 · PRO 6,900원 · MAX 12,900원)
 * 그대로 두면 맥스 구독자의 `currentPlan` 이 타입에 없는 값이 된다.
 *
 * ⚠️ 요금제가 추가되면 여기도 늘려야 한다. 유니온을 좁게 유지하는 대신 **표시 문구는
 * 이 타입에서 파생하지 않는다** — 이름·가격·혜택은 서버 응답이 출처다
 * (`premium/lib/planDisplay`). 여기서 하는 일은 "어떤 코드가 올 수 있나" 뿐이다.
 */
export type CurrentPlan = 'FREE' | 'PLUS' | 'PRO' | 'MAX';

export type AuthUser = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  currentPlan: CurrentPlan;
};

export type SocialLoginData = {
  isNewUser: boolean;
  /**
   * 탈퇴했다가 유예 기간 안에 다시 로그인해 **복구된** 계정.
   *
   * `isNewUser` 와 다르다 — 복구는 예전 기록이 그대로 살아 돌아온 것이라 신규 가입
   * 안내를 띄우면 안 된다. `DELETE /users/me` 가 돌려주는 `recoverableUntil` 이 그
   * 유예 기간이다.
   *
   * ⚠️ 서버는 보내는데 화면이 아직 안 쓴다. 복구 사용자에게 "다시 오셨네요" 같은 안내를
   * 붙이려면 이 값이 출처다.
   */
  isRecovered?: boolean;
  needTermsAgreement?: boolean;
  needProfileSetup?: boolean;
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshTokenData = {
  accessToken: string;
  expiresIn: number;
};

/*
  `ApiResponse` · `ApiSuccessResponse` · `ApiErrorResponse` 는 지웠다. 공용 래퍼는
  `@/shared/types/api` 하나다.

  여기 있던 타입은 **명세서 기준**이라 실제 서버와 형태가 달랐다:
    여기: { resultType: 'SUCCESS' | 'FAIL', error: { code, message }, success: { message }, data }
    서버: { success: boolean, code: string, message: string, data }

  서버가 `resultType` 을 보낸 적이 없어서 `if (res.resultType === 'FAIL')` 검사 18곳이
  **전부 항상 거짓**이었다(2026-08-08 `/swagger-json` 대조로 확인). 4xx·5xx 는 axios 가
  예외로 던져서 화면이 안 깨졌을 뿐, 200 에 `success: false` 가 실려 오면 못 걸렀다.
  `success` 도 서버에선 불리언인데 여기선 객체라, 누가 `res.success.message` 를 읽는
  순간 터질 자리였다.

  에러 코드 유니온(`AUTH_INVALID_ACCESS_TOKEN` 등)도 같이 사라졌다. 실제 코드는
  `AUTH401` · `COMMON500` 꼴이라 저 목록과 겹치는 게 없었다 — 코드로 갈라 처리하는
  곳은 `lib/apiError` 와 `profile/lib/profileError` 가 HTTP 상태로 판별한다.
*/
