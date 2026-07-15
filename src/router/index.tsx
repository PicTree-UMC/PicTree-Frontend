import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthPage } from '../features/auth/AuthPage';
import { BlogPage } from '../features/blog/BlogPage';
import { CameraPage } from '../features/camera/CameraPage';
import { HomePage } from '../features/home/HomePage';
import { JourneyPage } from '../features/journey/JourneyPage';
import { RouteViewPage } from '../features/journey/RouteViewPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SubscriptionPage } from '../features/profile/SubscriptionPage';
import { TravelCalendarPage } from '../features/profile/TravelCalendarPage';
import { FavoritesPage } from '../features/profile/FavoritesPage';
import { RecordPage } from '../features/record/RecordPage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { Layout } from '../shared/components';
import { ROUTES } from '../shared/constants/routes';

export const router = createBrowserRouter([
  {
    path: ROUTES.root,
    element: <Navigate to={ROUTES.home} replace />,
  },
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
  {
    path: ROUTES.camera,
    element: <CameraPage />,
  },
  {
    path: ROUTES.record,
    element: <RecordPage />,
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
        path: ROUTES.blog,
        element: <BlogPage />,
      },
    ],
  },
  {
    path: ROUTES.journeyView,
    element: <RouteViewPage />,
  },
]);
