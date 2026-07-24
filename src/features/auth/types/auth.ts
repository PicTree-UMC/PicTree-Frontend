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

export type AgreementTerm = {
  id: TermId;
  title: string;
  description: string;
  required: boolean;
};

export type CurrentPlan = 'FREE' | 'PREMIUM';

export type AuthUser = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  currentPlan: CurrentPlan;
};

export type SocialLoginData = {
  isNewUser: boolean;
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

export type ApiSuccessResponse<TData> = {
  resultType: 'SUCCESS';
  error: null;
  success: {
    message: string;
  };
  data: TData;
};

export type ApiErrorResponse = {
  resultType: 'FAIL';
  error: {
    code:
      | 'BAD_REQUEST'
      | 'AUTH_SOCIAL_AUTHENTICATION_FAILED'
      | 'AUTH_INVALID_ACCESS_TOKEN'
      | 'AUTH_INVALID_REFRESH_TOKEN'
      | 'USER_UNAVAILABLE'
      | 'INTERNAL_SERVER_ERROR';
    message: string;
  };
  success: null;
  data: null;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
