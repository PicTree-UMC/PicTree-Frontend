import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
import { queryClient } from './shared/lib/queryClient';
import { hideSplash } from './shared/lib/splash';
import { watchViewportGap } from './shared/lib/viewport';
import { AppShell, Toaster } from './shared/components';
import './styles.css';

// 앱 프레임 높이 보정(iOS PWA). 첫 렌더 전에 세워야 화면이 그려진 뒤 튀지 않는다.
watchViewportGap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <RouterProvider router={router} />
      </AppShell>
      {/* 토스트는 fixed 라 셸 밖에 둔다. items-center 정렬이라 컬럼과 자연히 맞는다. */}
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);

hideSplash();
