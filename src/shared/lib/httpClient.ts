import axios from 'axios';

import { useAuthStore } from '@/features/auth/store/authStore';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

/**
 * 보호된 API(/trees 등)는 로그인 시 발급된 access token 을 요구한다.
 * 매 요청마다 authStore 의 최신 토큰을 Authorization 헤더로 실어 보낸다.
 */
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
