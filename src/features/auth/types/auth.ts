export type AuthView = 'welcome' | 'login' | 'signup';
export type AuthFormMode = Exclude<AuthView, 'welcome'>;

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = LoginFormValues & {
  nickname: string;
  passwordConfirm: string;
};

export type AuthSubmitValues = LoginFormValues | SignupFormValues;

export type AuthFieldName = keyof SignupFormValues;

export type AuthField = {
  name: AuthFieldName;
  label?: string;
  placeholder: string;
  type?: 'email' | 'password' | 'text';
  autoComplete?: string;
};

export type AuthFormCopy = {
  title: string;
  description: string;
  submitLabel: string;
  footerText: string;
  footerAction: string;
};

export type LoginRequest = LoginFormValues;

export type SignupRequest = {
  nickname: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
};
