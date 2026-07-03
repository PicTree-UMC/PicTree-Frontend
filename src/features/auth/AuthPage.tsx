import { useState } from 'react';

import { AuthForm } from './components/AuthForm';
import { AuthShell } from './components/AuthShell';
import { WelcomeView } from './components/WelcomeView';
import { AUTH_FORM_FIELDS } from './constants/authFormFields';
import type {
  AuthSubmitValues,
  AuthView,
  LoginRequest,
  SignupFormValues,
  SignupRequest,
} from './types/auth';

export function AuthPage() {
  const [view, setView] = useState<AuthView>('welcome');

  const showLogin = () => setView('login');
  const showSignup = () => setView('signup');

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
          fields={AUTH_FORM_FIELDS[view]}
          mode={view}
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
