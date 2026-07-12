import { createBrowserRouter } from 'react-router-dom';
import { App } from '../app/App';
import { AuthPage } from '../features/auth/AuthPage';
import { BlogPage } from '../features/blog/BlogPage';
import { HomePage } from '../features/home/HomePage';
import { JourneyPage } from '../features/journey/JourneyPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { PremiumPage } from '../features/premium/PremiumPage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { Layout } from '../shared/components';
import { ROUTES } from '../shared/constants/routes';

export const router = createBrowserRouter([
  {
    path: ROUTES.root,
    element: <App />,
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
        path: ROUTES.blog,
        element: <BlogPage />,
      },
      {
        path: ROUTES.premium,
        element: <PremiumPage />,
      },
    ],
  },
]);
