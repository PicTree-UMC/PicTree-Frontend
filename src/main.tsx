import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
import { queryClient } from './shared/lib/queryClient';
import { hideSplash } from './shared/lib/splash';
import { AppShell, ErrorBoundary, ErrorView, Toaster } from './shared/components';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*
        바운더리가 셸 **바깥**에 선다 — 안쪽에 두면 `Toaster` 가 안 덮여, 토스트가
        터지면 여전히 백지가 된다. 대신 폴백을 `AppShell` 로 감싸 넘겨서 에러 화면도
        390px 컬럼 안에 그려지게 한다.

        라우트 안에서 나는 에러는 라우터의 `errorElement` 가 먼저 잡는다. 여기가 맡는
        건 라우터 바깥과 라우터 자체가 터지는 경우다.
      */}
      <ErrorBoundary
        fallback={
          <AppShell>
            <ErrorView
              heading="문제가 발생했어요"
              detail="화면을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
              actionLabel="처음으로"
              /*
                여기서는 `navigate` 를 못 쓴다 — 라우터 바깥이고, 라우터 자체가 죽었을
                수도 있다. `reload()` 가 아니라 홈으로 보내는 것도 의도다: 지금 경로가
                터진 원인이면 새로고침은 같은 화면으로 돌아와 다시 터진다.
              */
              onAction={() => window.location.assign('/')}
            />
          </AppShell>
        }
      >
        <AppShell>
          <RouterProvider router={router} />
        </AppShell>
        {/* 토스트는 fixed 라 셸 밖에 둔다. items-center 정렬이라 컬럼과 자연히 맞는다. */}
        <Toaster />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);

hideSplash();
