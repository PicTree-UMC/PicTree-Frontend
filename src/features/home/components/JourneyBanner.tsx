import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type JourneyBannerProps = {
  placeCount: number;
};

/** 홈 상단에 뜨는 "나의 여행 발자국" 안내 카드. 동선 페이지로 이동하는 버튼 포함. */
export function JourneyBanner({ placeCount }: JourneyBannerProps) {
  return (
    <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-lg">
          🌳
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-neutral-900">나의 여행 발자국</span>
          <span className="text-xs text-neutral-500">{placeCount}개의 장소를 기록했어요.</span>
        </div>
      </div>
      <Link
        to={ROUTES.journey}
        className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200"
      >
        동선보기
      </Link>
    </div>
  );
}
