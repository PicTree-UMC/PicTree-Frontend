import { useRef } from 'react';

import { Button } from '../../../shared/components';
import { PicTreeMark } from '../../../shared/components/PicTreeMark';
import { useWelcomeToastAnchor } from '../hooks/useWelcomeToastAnchor';
import type { SocialLoginProvider } from '../types/auth';

type WelcomeViewProps = {
  onSocialLogin: (provider: SocialLoginProvider) => void;
};

export function WelcomeView({ onSocialLogin }: WelcomeViewProps) {
  /*
    두 블록 사이 빈칸이 토스트 자리다. 로그인 실패 사유가 이 화면에서만 나오는데,
    공용 위치는 새싹 일러스트 위에 앉아 글이 그림과 겹쳤다. 자리는 훅이 재서 알린다.
  */
  const contentRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useWelcomeToastAnchor(contentRef, actionsRef);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center pb-[9.25rem] text-center">
        <PicTreeMark />
        <h1 className="mt-7 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-bold leading-[2.5rem] tracking-[0px] text-[#2C3930]">
          나의 여행 발자국
        </h1>
        {/* 빈칸의 위 모서리다 — 바깥 div 에 ref 를 달면 pb-[9.25rem] 까지 포함돼 버튼 위와 같아진다. */}
        <p
          ref={contentRef}
          className="mt-2 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-medium leading-[2.5rem] tracking-[0px] text-[#2C3930]"
        >
          발걸음마다 기록하고, 나무처럼 키우세요
        </p>
      </div>

      <div ref={actionsRef} className="space-y-2">
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
      className={`flex h-[4.3125rem] w-full items-center justify-center gap-3 rounded-[1.5rem] font-['KOROAD'] text-[1.125rem] font-bold text-[#2C3930] transition ${
        isKakao ? 'bg-[#FFEC9A] hover:bg-[#f7df70]' : 'bg-line-soft hover:bg-line'
      }`}
      type="button"
      onClick={onClick}
    >
      <img alt={iconAlt} className="h-6 w-6 object-contain" src={iconSrc} />
      {isKakao ? '카카오 로그인' : 'Google 로그인'}
    </Button>
  );
}
