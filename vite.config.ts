import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'], // ngrok 터널로 실기기 테스트할 때 필요
    /*
      배포의 `netlify.toml` API 프록시와 짝이다 — **둘 중 하나만 있으면 그 환경이 깨진다.**
      `VITE_API_BASE_URL` 이 `/api/v1` 같은 상대 경로라, 여기가 없으면 로컬에서 요청이
      dev 서버 자신에게 가서 index.html 을 받는다.

      프록시를 태우면 로컬도 **같은 오리진**이 되어 refresh 쿠키가 퍼스트파티가 된다.
      배포에서만 되는 게 아니라 로컬에서도 같은 조건으로 확인할 수 있다는 뜻이다.

      `changeOrigin` 은 Host 헤더를 대상(tenma.store)으로 바꾼다. 없으면 백엔드가
      `Host: localhost:5173` 을 보게 된다.
    */
    proxy: {
      '/api': {
        target: 'https://tenma.store',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
