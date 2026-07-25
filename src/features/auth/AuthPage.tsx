import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthShell } from './components/AuthShell';
import { DevicePermissionModal } from './components/DevicePermissionModal';
import { TermsAgreementView } from './components/TermsAgreementView';
import { WelcomeView } from './components/WelcomeView';
import { redirectToOAuth } from './lib/oauth';
import { useToast } from '../../shared/components';
import { ROUTES } from '../../shared/constants/routes';
import type { AuthStep, SocialLoginProvider } from './types/auth';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const initialStep = searchParams.get('step') === 'terms' ? 'terms' : 'social-login';
  const [step] = useState<AuthStep>(initialStep);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const handleSocialLogin = (nextProvider: SocialLoginProvider) => {
    try {
      redirectToOAuth(nextProvider);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '소셜 로그인 설정을 확인해 주세요.', 'error', {
        placement: 'top',
      });
    }
  };

  const handleTermsAgree = () => {
    setIsPermissionModalOpen(true);
  };

  const handlePermissionConfirm = () => {
    setIsPermissionModalOpen(false);
    navigate(ROUTES.home, { replace: true });
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
