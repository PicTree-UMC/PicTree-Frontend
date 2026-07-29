import axios, { type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/features/auth/store/authStore';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // refresh 토큰은 httpOnly 쿠키로 오간다
});

// Bearer 를 붙이면 안 되는 공개/쿠키인증 엔드포인트.
// 로그인은 토큰을 "발급받는" 곳이고 refresh 는 쿠키로 갱신한다 — 여기에 만료된
// access 토큰이 실려 나가면 백엔드가 로그인/갱신 처리 전에 401 로 까버린다.
const NO_AUTH_PATHS = ['/auth/social-login', '/auth/token/refresh'];

// access 토큰은 Bearer 헤더로 실어 보낸다 — refresh 토큰(쿠키)과 짝을 이루는 표준 조합.
// authStore 가 localStorage 에서 토큰을 초기화하므로 새로고침 후에도 유지된다.
// (지금까지 logout 만 수동으로 Bearer 를 붙이고 있었다 — 그 미구현 인터셉터가 이것이다.)
httpClient.interceptors.request.use((config) => {
  const isNoAuthPath = NO_AUTH_PATHS.some((path) => config.url?.startsWith(path));

  if (isNoAuthPath) {
    return config;
  }

  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/** 한 번 재시도했는지 표시. 재발급 후에도 401 이면 무한 루프 대신 실패시킨다. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * 진행 중인 재발급 요청. 여러 API 가 동시에 401 을 받아도 재발급은 한 번만 하고
 * 나머지는 그 결과를 기다린다 (동시 요청 × 재발급 폭주 방지).
 */
let refreshPromise: Promise<string> | null = null;

/**
 * 재발급 응답. 백엔드 공통 래퍼(`{success,code,message,data}`)로 오며 실제 값은 `data` 안이다.
 * 공통 래퍼 타입에 의존하지 않고 여기서 최소한만 선언한다 — httpClient 는 모든 도메인이
 * 쓰는 최하위 모듈이라 특정 feature 의 타입을 끌어오면 안 된다.
 */
type RefreshResponse = {
  data: { accessToken: string; expiresIn: number };
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = httpClient
      .post<RefreshResponse>('/auth/token/refresh')
      .then(({ data }) => {
        const { accessToken, expiresIn } = data.data;
        useAuthStore.getState().setAccessToken(accessToken, expiresIn);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// access 토큰은 1시간짜리다. 만료되면 작업 중이던 화면이 통째로 401 을 뱉으므로,
// 401 을 받으면 재발급(쿠키 기반) 후 원래 요청을 한 번만 재시도한다.
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableConfig | undefined;
    const isNoAuthPath = NO_AUTH_PATHS.some((path) => config?.url?.startsWith(path));

    // 로그인·재발급 자체의 401 은 재시도 대상이 아니다. 여기서 막지 않으면
    // 재발급 실패 → 재발급 재시도 → … 로 무한히 돈다.
    if (!config || config._retried || isNoAuthPath) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;

      return await httpClient(config);
    } catch {
      // 재발급도 실패 = 쿠키까지 만료. 로그인 화면으로 보내려면 상태를 비워야 한다.
      useAuthStore.getState().clearAuth();

      return Promise.reject(error);
    }
  },
);
