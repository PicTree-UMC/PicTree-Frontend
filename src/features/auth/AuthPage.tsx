import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthForm } from './components/AuthForm';
import { AuthShell } from './components/AuthShell';
import { WelcomeView } from './components/WelcomeView';
import { AUTH_FORM_FIELDS } from './constants/authFormFields';
import { ROUTES } from '../../shared/constants/routes';
import type {
  AuthSubmitValues,
  AuthFormMode,
  LoginRequest,
  SignupFormValues,
  SignupRequest,
} from './types/auth';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const view = useMemo(() => {
    if (location.pathname === ROUTES.authLogin) {
      return 'login' as const;
    }

    if (location.pathname === ROUTES.authSignup) {
      return 'signup' as const;
    }

    return 'welcome' as const;
  }, [location.pathname]);

  const showLogin = () => navigate(ROUTES.authLogin);
  const showSignup = () => navigate(ROUTES.authSignup);

  const handleSubmit = (values: AuthSubmitValues) => {
    if (view === 'login') {
      const payload: LoginRequest = {
        email: values.email,
        password: values.password,
      };

      void payload;
      return;
    }

    const signupValues = toSignupValues(values);
    const payload: SignupRequest = {
      nickname: signupValues.nickname,
      email: signupValues.email,
      password: signupValues.password,
    };

    void payload;
  };

  return (
    <AuthShell>
      {view === 'welcome' ? (
        <WelcomeView onLogin={showLogin} onSignup={showSignup} />
      ) : (
        <AuthForm
          key={view}
          fields={AUTH_FORM_FIELDS[view]}
          mode={view as AuthFormMode}
          onSubmit={handleSubmit}
          onToggle={view === 'login' ? showSignup : showLogin}
        />
      )}
    </AuthShell>
  );
}

function toSignupValues(values: AuthSubmitValues): SignupFormValues {
  return values as SignupFormValues;
}
