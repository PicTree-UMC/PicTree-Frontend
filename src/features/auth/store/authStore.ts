import { create } from 'zustand';

import type { AuthUser, SocialLoginData } from '../types/auth';

const ACCESS_TOKEN_STORAGE_KEY = 'pictree.accessToken';

type AuthState = {
  accessToken: string | null;
  expiresIn: number | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (data: SocialLoginData) => void;
  setAccessToken: (accessToken: string, expiresIn: number) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  expiresIn: null,
  user: null,
  isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)),
  setAuth: (data) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
    set({
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      user: data.user,
      isAuthenticated: true,
    });
  },
  setAccessToken: (accessToken, expiresIn) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    set({
      accessToken,
      expiresIn,
      isAuthenticated: true,
    });
  },
  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    set({
      accessToken: null,
      expiresIn: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
