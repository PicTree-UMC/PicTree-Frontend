import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute';
import { BlogPage } from '../features/blog/BlogPage';
import { BlogCreatePage } from '../features/blog/BlogCreatePage';
import { BlogDetailPage } from '../features/blog/BlogDetailPage';
import { BillingFailPage } from '../features/premium/BillingFailPage';
import { BillingSuccessPage } from '../features/premium/BillingSuccessPage';
import { CameraPage } from '../features/camera/CameraPage';
import { HomePage } from '../features/home/HomePage';
import { RouteListPage } from '../features/route/RouteListPage';
import { RouteCreatePage } from '../features/route/RouteCreatePage';
import { RouteViewPage } from '../features/route/RouteViewPage';
import { RouteSavePage } from '../features/route/RouteSavePage';
import { RouteSavedPage } from '../features/route/RouteSavedPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { PaymentMethodsPage } from '../features/premium/PaymentMethodsPage';
import { PaymentHistoryPage } from '../features/premium/PaymentHistoryPage';
import { PremiumPage } from '../features/premium/PremiumPage';
import { ProfileEditPage } from '../features/profile/ProfileEditPage';
import { TravelCalendarPage } from '../features/profile/TravelCalendarPage';
import { FavoritesPage } from '../features/profile/FavoritesPage';
import { HelpFaqPage } from '@/features/profile/HelpFaqPage';
import { PrivacyPolicyPage } from '../features/profile/PrivacyPolicyPage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { ErrorPage, Layout } from '../shared/components';
import { ROUTES } from '../shared/constants/routes';

/*
  전체를 경로 없는 라우트 하나로 감싸 `errorElement` 를 단다.

  라우트마다 붙이지 않는 이유: 빠뜨린 곳이 생기고, 새 라우트를 더할 때마다 기억해야 한다.
  경로가 없는 라우트는 element 를 안 주면 `<Outlet/>` 으로 동작하므로 **경로 해석은
  그대로다** — 아래 children 은 감싸기 전과 같은 URL 로 매칭된다.

  ⚠️ 에러가 나면 화면 전체가 `ErrorPage` 로 바뀐다(탭바 포함). 탭바를 남기고 싶으면
  `Layout` 라우트에 하나 더 다는 방법이 있는데, 그때는 **바깥쪽이 아니라 가장 가까운
  errorElement 가 잡는다.** 지금은 M1 을 닫는 게 목적이라 한 겹만 둔다.
*/
export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        path: ROUTES.root,
        element: <Navigate to={ROUTES.home} replace />,
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: ROUTES.auth,
            element: <AuthPage />,
          },
          {
            path: ROUTES.authLogin,
            element: <AuthPage />,
          },
          {
            path: ROUTES.authSignup,
            element: <AuthPage />,
          },
        ],
      },
      {
        path: ROUTES.authCallback,
        element: <AuthCallbackPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.camera,
            element: <CameraPage />,
          },
          {
            path: ROUTES.blogCreate,
            element: <BlogCreatePage />,
          },
          {
            path: ROUTES.blogDetail,
            element: <BlogDetailPage />,
          },
          {
            // 토스 빌링 인증 후 착지 (탭바 없는 전환 화면). 구독은 로그인 필요 → 보호 구역.
            path: ROUTES.premiumBillingSuccess,
            element: <BillingSuccessPage />,
          },
          {
            path: ROUTES.premiumBillingFail,
            element: <BillingFailPage />,
          },
          {
            element: <Layout />,
            children: [
              {
                path: ROUTES.home,
                element: <HomePage />,
              },
              {
                path: ROUTES.timeline,
                element: <TimelinePage />,
              },
              {
                path: ROUTES.journey,
                element: <RouteListPage />,
              },
              {
                path: ROUTES.profile,
                element: <ProfilePage />,
              },
              {
                path: ROUTES.profileEdit,
                element: <ProfileEditPage />,
              },
              {
                path: ROUTES.paymentMethods,
                element: <PaymentMethodsPage />,
              },
              {
                path: ROUTES.paymentHistory,
                element: <PaymentHistoryPage />,
              },
              {
                path: ROUTES.calendar,
                element: <TravelCalendarPage />,
              },
              {
                path: ROUTES.favorites,
                element: <FavoritesPage />,
              },
              {
                path: ROUTES.helpFaq,
                element: <HelpFaqPage />,
              },
              {
                path: ROUTES.privacy,
                element: <PrivacyPolicyPage />,
              },
              {
                path: ROUTES.blog,
                element: <BlogPage />,
              },
              {
                path: ROUTES.premium,
                element: <PremiumPage />,
              },
            ],
          },
          {
            // 새 동선 만들기 ①단계. 지도가 필요 없는 화면이라 탭바 밖에 둔다(② 와 같은 층).
            path: ROUTES.journeyCreate,
            element: <RouteCreatePage />,
          },
          {
            path: ROUTES.journeyView,
            element: <RouteViewPage />,
          },
          {
            // ③단계. ①·② 와 같은 층 — 지도도 탭바도 없이 저장할 내용만 보여주는 화면이다.
            path: ROUTES.journeySave,
            element: <RouteSavePage />,
          },
          {
            // ④단계. 저장이 끝난 뒤 다음 수를 권하는 화면이라 여기도 탭바 밖이다.
            path: ROUTES.journeySaved,
            element: <RouteSavedPage />,
          },
          {
            // 같은 페이지가 '저장된 동선 보기' 모드로 뜬다. 데이터 출처와 헤더만 갈린다.
            path: ROUTES.journeyViewDetail,
            element: <RouteViewPage />,
          },
        ],
      },
    ],
  },
]);
