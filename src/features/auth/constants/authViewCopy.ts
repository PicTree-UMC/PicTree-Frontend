import type { AuthFormCopy, AuthFormMode } from '../types/auth';

export const AUTH_VIEW_COPY = {
  login: {
    title: '다시 만나서 반가워요!',
    description: '이메일로 로그인하세요',
    submitLabel: '로그인',
    footerText: '아직계정이 없으신가요?',
    footerAction: '회원가입',
  },
  signup: {
    title: '새로 시작하기',
    description: '여행을 시작하고, 나무를 키워보세요',
    submitLabel: '회원가입',
    footerText: '이미 계정이 있으신가요?',
    footerAction: '로그인',
  },
} satisfies Record<AuthFormMode, AuthFormCopy>;
