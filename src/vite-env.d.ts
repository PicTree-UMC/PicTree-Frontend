/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KAKAO_MAP_APP_KEY: string;
  /** 토스페이먼츠 클라이언트 키(테스트). 공개돼도 되는 키 — 시크릿 키는 백엔드 전용. */
  readonly VITE_TOSS_CLIENT_KEY: string;
  /**
   * 웹 푸시 VAPID **공개**키. 서버의 `VAPID_PUBLIC_KEY` 와 같은 값이어야 한다.
   * 브라우저에 노출되는 값이라 번들에 들어가도 된다 — 비밀키는 서버 전용이다.
   *
   * 없으면 알림 토글이 꺼진 채로 안내만 뜬다(`getPushUnavailableReason`).
   */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
