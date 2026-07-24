import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthShell } from './components/AuthShell';
import { DevicePermissionModal } from './components/DevicePermissionModal';
import { TermsAgreementView } from './components/TermsAgreementView';
import { WelcomeView } from './components/WelcomeView';
import { ROUTES } from '../../shared/constants/routes';
import type { AuthStep, SocialLoginProvider } from './types/auth';

export function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('social-login');
  const [provider, setProvider] = useState<SocialLoginProvider | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const handleSocialLogin = (nextProvider: SocialLoginProvider) => {
    setProvider(nextProvider);
    setStep('terms');
  };

  const handleTermsAgree = () => {
    setIsPermissionModalOpen(true);
  };

  const handlePermissionConfirm = () => {
    if (provider) {
      // TODO: OAuth SDK에서 authorizationCode를 받은 뒤 socialLogin({ provider, authorizationCode, redirectUri }) 호출
      void provider;
    }

    setIsPermissionModalOpen(false);
    navigate(ROUTES.home);
  };

  return (
    <AuthShell>
      {step === 'social-login' ? (
        <WelcomeView onSocialLogin={handleSocialLogin} />
      ) : (
        <TermsAgreementView onAgree={handleTermsAgree} />
      )}
      <DevicePermissionModal
        isOpen={isPermissionModalOpen}
        onConfirm={handlePermissionConfirm}
      />
    </AuthShell>
  );
}
