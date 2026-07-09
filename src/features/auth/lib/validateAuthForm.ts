import type { AuthFieldName, AuthFormMode, AuthSubmitValues, SignupFormValues } from '../types/auth';

export type AuthFormErrors = Partial<Record<AuthFieldName, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(mode: AuthFormMode, values: AuthSubmitValues): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const email = values.email.trim();
  const password = values.password;

  if (!email) {
    errors.email = '이메일을 입력해 주세요.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = '올바른 양식의 이메일을 입력해주세요.';
  }

  if (!password) {
    errors.password = '비밀번호를 입력해주세요.';
  } else if (password.length < 6) {
    errors.password = '비밀번호는 6자 이상으로 입력해주세요.';
  }

  if (mode === 'signup') {
    const signupValues = values as SignupFormValues;
    const nickname = signupValues.nickname.trim();

    if (!nickname) {
      errors.nickname = '닉네임을 입력해 주세요.';
    } else if (nickname.length < 2 || nickname.length > 20) {
      errors.nickname = '닉네임은 2~20자 사이로 입력해 주세요.';
    }

    if (!signupValues.passwordConfirm) {
      errors.passwordConfirm = '비밀번호를 다시 입력해 주세요.';
    } else if (signupValues.passwordConfirm !== password) {
      errors.passwordConfirm = '비밀번호가 일치하지 않아요.';
    }
  }

  return errors;
}
