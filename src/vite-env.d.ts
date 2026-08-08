/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KAKAO_MAP_APP_KEY: string;
  /** 토스페이먼츠 클라이언트 키(테스트). 공개돼도 되는 키 — 시크릿 키는 백엔드 전용. */
  readonly VITE_TOSS_CLIENT_KEY: string;
  /*
    `VITE_VAPID_PUBLIC_KEY` 는 지웠다 — 웹 푸시를 걷어내면서 읽는 곳이 없어졌다.
    배포 환경 변수에 남아 있어도 무해하지만, 다시 쓸 일이 생기면 서버의
    `VAPID_PUBLIC_KEY` 와 같은 값이어야 한다는 점만 기억하면 된다.
  */
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
