import { Fragment } from 'react';
import { RoutePlace } from '../types/route';

interface RoutePlaceStripProps {
  places: RoutePlace[];
  title: string;
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

export function RoutePlaceStrip({ places, title }: RoutePlaceStripProps) {
  return (
    <div className="bg-[#c5d89d] px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
      <h2 className="mb-3 text-base font-semibold tracking-tight text-[#2c3930]">{title}</h2>

      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {places.map((place, index) => (
          <Fragment key={place.id}>
            {index > 0 && (
              <ChevronRight className="h-6 w-3.5 shrink-0 self-center text-[#2c3930]" />
            )}
            <div className="relative flex h-20 w-[120px] shrink-0 flex-col rounded-[12px] border border-[#c5d89d] bg-[#fffdf7] p-2 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#89986d] text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
                <p className="truncate text-xs font-medium text-[#111]">{place.name}</p>
              </div>
              <EmojiFace className="my-auto h-6 w-6 self-center" />
              <p className="self-center text-xs text-[#2c3930]">한줄평</p>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
