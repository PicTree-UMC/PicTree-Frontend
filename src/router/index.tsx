import { createBrowserRouter } from 'react-router-dom';

import { App } from '../app/App';
import { AuthPage } from '../features/auth/AuthPage';
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
]);
