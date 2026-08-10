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
        <h1 className="mt-7 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-bold leading-[2.5rem] tracking-[0px] text-ink">
          나의 여행 발자국
        </h1>
        {/* 빈칸의 위 모서리다 — 바깥 div 에 ref 를 달면 pb-[9.25rem] 까지 포함돼 버튼 위와 같아진다. */}
        <p
          ref={contentRef}
          className="mt-2 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-medium leading-[2.5rem] tracking-[0px] text-ink"
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
  /*
    ⚠️ **확장자가 `.svg` 였지만 벡터가 아니었다.** Figma 가 뽑은 파일이 `<rect>` 하나에
    `<pattern>` 으로 base64 PNG 를 박아 둔 것이라, google 은 28.7KB · kakao 는 11.4KB 였다
    (base64 는 원본보다 약 4/3 로 부푼다). 24px 로 그리면서 360×360 원본을 싣고 있었다.

    로그인 화면은 **첫 진입에 반드시 실리는 화면**이라 그 40KB 가 그대로 첫 전송량이다.
    같은 그림을 3배 크기(72px)로만 줄여 담았다 — 디자인이 승인한 그림 그대로고 8.4KB 다.
  */
  const iconSrc = isKakao ? '/assets/social/kakao-talk.png' : '/assets/social/google.png';
  const iconAlt = isKakao ? '카카오톡' : 'Google';

  return (
    <Button
      unstyled
      className={`flex h-[4.3125rem] w-full items-center justify-center gap-3 rounded-[1.5rem] font-['KOROAD'] text-[1.125rem] font-bold text-ink transition ${
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
