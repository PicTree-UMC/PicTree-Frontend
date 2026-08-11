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
 * 실패의 HTTP 상태. **응답이 없으면 `undefined`** 이고, 그게 곧 "서버가 거절한 게 아니라
 * 닿지도 못했다"(네트워크 끊김·timeout)는 뜻이다. 아래에서 로그아웃 여부를 가르는 기준이다.
 */
const statusOf = (error: unknown) =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

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

    let accessToken: string;

    try {
      accessToken = await refreshAccessToken();
    } catch (refreshError) {
      /*
        ⚠️ **재발급 실패를 뭉뚱그려 로그아웃하지 않는다.**

        전에는 `catch` 하나로 받아 무조건 `clearAuth()` 했고, 주석도 "재발급도 실패 =
        쿠키까지 만료" 라고 단정했다. 하지만 여기로 오는 실패에는 **네트워크 끊김과
        timeout(10초)** 도 섞인다. 모바일 웹이라 지하철·터널에서 access 토큰 만료가
        겹치면 **쿠키가 멀쩡한데도 그 순간 로그인이 풀렸다.** 사용자에게는 refresh 쿠키
        문제와 증상이 구별되지 않는다.

        분류 기준은 `profile/lib/profileError.ts` 와 같다 — 401 은 세션이 죽은 것,
        응답이 없는 실패는 일시적인 것.

        403 까지 로그아웃에 넣는 것은 **재발급 요청에 한해서**다. 이 엔드포인트의 403 은
        폐기된 refresh 토큰이라는 뜻이라 더 시도할 것이 없다. (아래 재시도 쪽은 다르다.)
      */
      const status = statusOf(refreshError);

      if (status === 401 || status === 403) {
        useAuthStore.getState().clearAuth();
      }

      /*
        원래 401 이 아니라 **재발급 에러**를 올린다. 네트워크로 실패했는데 401 을 올리면
        화면도 로그도 원인을 못 본다. 상태 코드로 갈라 처리하는 곳은 없고
        (`getApiErrorMessage` 는 `response.data.message` 를 읽어 없으면 fallback 이다)
        네트워크 실패에는 fallback 문구가 오히려 맞다.
      */
      return Promise.reject(refreshError);
    }

    config.headers.Authorization = `Bearer ${accessToken}`;

    try {
      return await httpClient(config);
    } catch (retryError) {
      /*
        방금 받은 토큰으로도 401 이면 세션이 죽은 것이다 — 재발급은 됐는데 그 토큰이
        거부되는 상황이라 더 해 볼 것이 없다. 여기서 안 끊으면 이후 요청마다
        401 → 재발급 성공 → 401 이 되풀이되며 **영영 로그아웃되지 않는다.**

        ⚠️ 위와 달리 **403 은 넣지 않는다.** 이건 업무 요청이라 403 이 "세션이 죽었다"가
        아니라 "그 리소스에 권한이 없다" 일 수 있다(`profileError.ts` 도 403 을 세션 만료가
        아니라 `account-unavailable` 로 가른다). 그걸로 로그아웃시키면 안 된다.
      */
      if (statusOf(retryError) === 401) {
        useAuthStore.getState().clearAuth();
      }

      return Promise.reject(retryError);
    }
  },
);
