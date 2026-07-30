import { Fragment } from 'react';
import { RoutePlace } from '../types/route';

interface RoutePlaceStripProps {
  places: RoutePlace[];
  maxPlaces: number;
}

/** 장소 카드 안 한줄평 위에 놓이는 스마일 이모지(디자인 image 20). 인라인 SVG 로 렌더. */
function EmojiFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#f5c33b" />
      <circle cx="9" cy="10" r="1.3" fill="#2c3930" />
      <circle cx="15" cy="10" r="1.3" fill="#2c3930" />
      <path
        d="M8 14c1 1.5 2.4 2.3 4 2.3s3-.8 4-2.3"
        stroke="#2c3930"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 카드 사이 구분자(디자인 ooui:next-ltr). */
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * 화면 하단의 동선 요약 바.
 *
 * 제목은 고른 날짜 수와 무관하게 '전체 동선' 하나다 — 날짜별 구분은 지도 쪽이 맡는다.
 * 장소 수를 n/20 으로 같이 보여주는 건 저장 한도가 20개이기 때문(화면설계서 0·2번).
 */
export function RoutePlaceStrip({ places, maxPlaces }: RoutePlaceStripProps) {
  return (
    <div className="bg-[#c5d89d] px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
      <h2 className="text-[15px] font-medium tracking-tight text-[#2c3930]">전체 동선</h2>
      <p className="mt-1 text-[13px] text-[#89986d]">
        장소 {places.length}/{maxPlaces}개
      </p>

      {places.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#89986d]">표시할 동선이 없어요</p>
      ) : (
        <div className="mt-3 flex items-stretch gap-1 overflow-x-auto pb-1">
          {places.map((place, index) => (
            <Fragment key={place.id}>
              {index > 0 && (
                <ChevronRight className="h-6 w-3.5 shrink-0 self-center text-[#2c3930]" />
              )}
              <div className="relative flex h-20 w-[120px] shrink-0 flex-col rounded-[12px] border border-[#c5d89d] bg-[#fffdf7] p-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#89986d] text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                  <p className="truncate text-[13px] font-medium text-[#111]">{place.name}</p>
                </div>
                <EmojiFace className="my-auto h-6 w-6 self-center" />
                <p className="self-center text-[13px] text-[#2c3930]">한줄평</p>
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
