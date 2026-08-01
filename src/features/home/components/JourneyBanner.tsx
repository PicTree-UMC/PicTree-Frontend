import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type JourneyBannerProps = {
  placeCount: number;
};

/** 홈 상단에 뜨는 "나의 여행 발자국" 안내 카드. 카메라(장소 기록) 화면으로 이동하는 버튼 포함. */
export function JourneyBanner({ placeCount }: JourneyBannerProps) {
  return (
    <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-lg">
          🌳
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-medium text-neutral-900">나의 여행 발자국</span>
          <span className="text-[13px] text-neutral-500">{placeCount}개의 장소를 기록했어요.</span>
        </div>
      </div>
      <Link
        to={ROUTES.camera}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-pictree-700 px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-pictree-700/90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        기록하기
      </Link>
    </div>
  );
}
