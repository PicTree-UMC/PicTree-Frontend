import { Button } from '../../../shared/components';
import { PicTreeMark } from '../../../shared/components/PicTreeMark';

type WelcomeViewProps = {
  onLogin: () => void;
  onSignup: () => void;
};

export function WelcomeView({ onLogin, onSignup }: WelcomeViewProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
        <PicTreeMark />
        <h1 className="mt-7 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-bold leading-[2.5rem] tracking-[0px] text-[#2C3930]">
          나의 여행 발자국
        </h1>
        <p className="mt-7 flex h-[2.375rem] flex-col justify-center text-center font-['KOROAD'] text-base font-medium leading-[2.5rem] tracking-[0px] text-[#2C3930]">
          발걸음마다 기록하고, 나무처럼 키우세요
        </p>
      </div>

      <div className="space-y-5">
        <Button
          unstyled
          className="flex h-[4.3125rem] w-full items-center justify-center rounded-[1.5rem] bg-[#89986D] pb-[0.9375rem] pt-[0.875rem] text-[1.125rem] font-bold text-[#FFF] hover:bg-[#7d9062]"
          type="button"
          onClick={onLogin}
        >
          로그인
        </Button>
        <Button
          unstyled
          className="flex h-[3.5625rem] w-full items-center justify-center rounded-[1.5rem] bg-[#F6F0D7] pb-[0.5625rem] pt-[0.5rem] text-[1.125rem] font-bold text-[#5C6F2B] hover:bg-[#eee8ce]"
          type="button"
          onClick={onSignup}
        >
          새로 시작하기
        </Button>
      </div>
    </div>
  );
}
