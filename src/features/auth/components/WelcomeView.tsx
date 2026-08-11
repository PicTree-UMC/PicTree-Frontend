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
    히어로 문구와 로그인 버튼 사이 빈칸이 토스트 자리다. 화면 높이에 따라 간격이
    달라지므로 두 지점을 훅이 재서 공용 토스트에 알려준다.
  */
  const contentRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useWelcomeToastAnchor(contentRef, actionsRef);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="fixed inset-0 z-0 mx-auto bg-gradient-to-b from-pictree-100 via-cream to-cream sm:max-w-[390px]" aria-hidden />

      <section className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center pb-8 text-center">
        <div className="mb-7" aria-label="PicTree">
          <PicTreeMark />
        </div>

        <TravelPhotoVisual />

        <h1 className="mt-8 text-[27px] font-medium leading-[1.4] tracking-[-0.035em] text-ink">
          여행의 모든 순간을
          <br />
          사진과 함께 심어보세요
        </h1>
        <p ref={contentRef} className="mt-3 text-[15px] font-light leading-[1.65] text-ink-muted">
          장소와 사진이 모여 나만의 나무가 자라요.
        </p>
      </section>

      <div ref={actionsRef} className="relative z-[1] space-y-2.5">
        <SocialLoginButton provider="KAKAO" onClick={() => onSocialLogin('KAKAO')} />
        <SocialLoginButton provider="GOOGLE" onClick={() => onSocialLogin('GOOGLE')} />
      </div>
    </div>
  );
}

function TravelPhotoVisual() {
  return (
    <div className="relative h-[142px] w-[210px]" aria-hidden>
      <div className="absolute left-1 top-3 h-[126px] w-[94px] -rotate-6 rounded-[18px] border border-pictree-300 bg-white p-2 shadow-[0_10px_24px_rgba(44,57,48,0.10)]">
        <div className="relative h-[88px] overflow-hidden rounded-[12px] bg-pictree-100">
          <span className="absolute right-3 top-3 size-5 rounded-full bg-cream" />
          <svg viewBox="0 0 90 70" className="absolute inset-x-0 bottom-0 w-full" fill="none">
            <path d="m0 62 25-29 17 19 13-14 35 32H0Z" fill="#C5D89D" />
            <path d="m0 66 34-22 16 12 15-8 25 18v4H0Z" fill="#788F4A" />
          </svg>
        </div>
        <span className="mx-auto mt-2 block h-1.5 w-10 rounded-full bg-line-soft" />
      </div>

      <div className="absolute right-0 top-0 h-[132px] w-[102px] rotate-6 rounded-[18px] border border-line-soft bg-white p-2 shadow-[0_12px_28px_rgba(44,57,48,0.13)]">
        <div className="relative grid h-[94px] place-items-center overflow-hidden rounded-[12px] bg-cream-sub">
          <svg viewBox="0 0 72 72" className="size-[72px]" fill="none">
            <path d="M36 10c-11 0-20 8.7-20 19.5C16 45 36 63 36 63s20-18 20-33.5C56 18.7 47 10 36 10Z" fill="#5B6B38" />
            <circle cx="36" cy="30" r="8" fill="#FFFCEF" />
          </svg>
        </div>
        <span className="mx-auto mt-2 block h-1.5 w-12 rounded-full bg-pictree-100" />
      </div>

      <span className="absolute bottom-0 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full border-4 border-cream bg-pictree-700 text-cream shadow-[0_7px_16px_rgba(44,57,48,0.18)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21v-7" />
          <path d="M12 14c-4.7 0-7-2.7-7-6.5C8.8 7.2 11.3 9 12 12c.7-3 3.2-4.8 7-4.5 0 3.8-2.3 6.5-7 6.5Z" />
        </svg>
      </span>
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
      className={`relative flex h-[54px] w-full items-center justify-center rounded-[18px] border text-[15px] font-medium text-ink transition active:scale-[0.99] ${
        isKakao
          ? 'border-[#FEE500] bg-[#FEE500] hover:bg-[#FFEC9A]'
          : 'border-line bg-white hover:bg-line-soft'
      }`}
      type="button"
      onClick={onClick}
    >
      <img alt={iconAlt} className="absolute left-5 h-6 w-6 object-contain" src={iconSrc} />
      {isKakao ? '카카오로 계속하기' : 'Google로 계속하기'}
    </Button>
  );
}
