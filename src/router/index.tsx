import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute';
import { BlogPage } from '../features/blog/BlogPage';
import { BlogCreatePage } from '../features/blog/BlogCreatePage';
import { BillingFailPage } from '../features/premium/BillingFailPage';
import { BillingSuccessPage } from '../features/premium/BillingSuccessPage';
import { CameraPage } from '../features/camera/CameraPage';
import { HomePage } from '../features/home/HomePage';
import { JourneyPage } from '../features/journey/JourneyPage';
import { RouteViewPage } from '../features/journey/RouteViewPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { PremiumPage } from '../features/premium/PremiumPage';
import { ProfileEditPage } from '../features/profile/ProfileEditPage';
import { SubscriptionPage } from '../features/profile/SubscriptionPage';
import { TravelCalendarPage } from '../features/profile/TravelCalendarPage';
import { FavoritesPage } from '../features/profile/FavoritesPage';
import { PrivacyPolicyPage } from '../features/profile/PrivacyPolicyPage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { Layout } from '../shared/components';
import { ROUTES } from '../shared/constants/routes';

export const router = createBrowserRouter([
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
            element: <JourneyPage />,
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
            path: ROUTES.subscription,
            element: <SubscriptionPage />,
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
        path: ROUTES.journeyView,
        element: <RouteViewPage />,
      },
    ],
  },
]);
