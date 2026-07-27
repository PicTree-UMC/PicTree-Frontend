/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KAKAO_MAP_APP_KEY: string;
  /** 토스페이먼츠 클라이언트 키(테스트). 공개돼도 되는 키 — 시크릿 키는 백엔드 전용. */
  readonly VITE_TOSS_CLIENT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
