import type { AuthField, AuthFormMode } from '../types/auth';

export const AUTH_FORM_FIELDS = {
  login: [
    {
      name: 'email',
      label: '이메일',
      placeholder: '이메일 주소',
      type: 'email',
      autoComplete: 'email',
    },
    {
      name: 'password',
      label: '비밀번호',
      placeholder: '비밀번호 입력',
      type: 'password',
      autoComplete: 'current-password',
    },
  ],
  signup: [
    {
      name: 'nickname',
      label: '닉네임',
      placeholder: '닉네임 입력',
      type: 'text',
      autoComplete: 'nickname',
    },
    {
      name: 'email',
      label: '이메일',
      placeholder: '이메일 주소',
      type: 'email',
      autoComplete: 'email',
    },
    {
      name: 'password',
      label: '비밀번호',
      placeholder: '비밀번호 입력',
      type: 'password',
      autoComplete: 'new-password',
    },
    {
      name: 'passwordConfirm',
      placeholder: '비밀번호 재입력',
      type: 'password',
      autoComplete: 'new-password',
    },
  ],
} satisfies Record<AuthFormMode, AuthField[]>;
