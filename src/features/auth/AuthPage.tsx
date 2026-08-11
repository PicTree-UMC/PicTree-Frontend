import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthShell } from './components/AuthShell';
import { DevicePermissionModal } from './components/DevicePermissionModal';
import { TermsAgreementView } from './components/TermsAgreementView';
import { WelcomeView } from './components/WelcomeView';
import { WELCOME_TOAST_OPTIONS } from './lib/authToast';
import { requestCameraPermission } from './lib/devicePermission';
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
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleSocialLogin = (nextProvider: SocialLoginProvider) => {
    try {
      redirectToOAuth(nextProvider);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '소셜 로그인 설정을 확인해 주세요.',
        'error',
        WELCOME_TOAST_OPTIONS,
      );
    }
  };

  const handleTermsAgree = () => {
    setIsPermissionModalOpen(true);
  };

  /*
    '확인' 이 실제로 권한 창을 띄운다(#271).

    권한 창이 떠 있는 동안 **모달을 먼저 닫지 않는다** — 뒤에 홈이 보이면 그 물음이 무엇에
    대한 것인지 사라진다. 허용이든 거부든 답이 온 뒤에 닫고 홈으로 간다.
  */
  const handlePermissionConfirm = async () => {
    if (isRequestingPermission) return; // 창이 떠 있는 동안의 연타 방지
    setIsRequestingPermission(true);

    await requestCameraPermission();

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
        isRequesting={isRequestingPermission}
        onConfirm={handlePermissionConfirm}
      />
    </AuthShell>
  );
}
