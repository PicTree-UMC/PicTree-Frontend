import { Button } from '../../../shared/components';
import { PicTreeMark } from '../../../shared/components/PicTreeMark';
import type { SocialLoginProvider } from '../types/auth';

type WelcomeViewProps = {
  onSocialLogin: (provider: SocialLoginProvider) => void;
};

export function WelcomeView({ onSocialLogin }: WelcomeViewProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center pb-[5rem] text-center">
        <PicTreeMark />
        <h1 className="mt-7 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-bold leading-[2.5rem] tracking-[0px] text-[#2C3930]">
          나의 여행 발자국
        </h1>
        <p className="mt-2 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-medium leading-[2.5rem] tracking-[0px] text-[#2C3930]">
          발걸음마다 기록하고, 나무처럼 키우세요
        </p>
      </div>

      <div className="space-y-2">
        <SocialLoginButton provider="KAKAO" onClick={() => onSocialLogin('KAKAO')} />
        <SocialLoginButton provider="GOOGLE" onClick={() => onSocialLogin('GOOGLE')} />
      </div>
    </div>
  );
}

function SocialLoginButton({
  provider,
  onClick,
}: {
  provider: SocialLoginProvider;
  onClick: () => void;
}) {
  const isKakao = provider === 'KAKAO';
  const iconSrc = isKakao ? '/assets/social/kakao-talk.svg' : '/assets/social/google.svg';
  const iconAlt = isKakao ? '카카오톡' : 'Google';

  return (
    <Button
      unstyled
      className={`flex h-[4.3125rem] w-full items-center justify-center gap-3 rounded-[1.5rem] font-['KOROAD'] text-[1.125rem]   text-[#2C3930] transition ${
        isKakao ? 'bg-[#FFEC9A] hover:bg-[#f7df70]' : 'bg-[#ECECEC] hover:bg-[#e2e2e2]'
      }`}
      type="button"
      onClick={onClick}
    >
      <img alt={iconAlt} className="h-6 w-6 object-contain" src={iconSrc} />
      {isKakao ? '카카오 로그인' : 'Google 로그인'}
    </Button>
  );
}
