import { Fragment } from 'react';
import { Place } from '../types/journey';

/** 장소 썸네일 자리를 채우는 스마일 이모지(디자인 image 20). 인라인 SVG. */
export function EmojiFace({ className }: { className?: string }) {
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

interface PlaceTrailProps {
  places: Place[];
  className?: string;
}

/** 동선 장소들을 이모지 + 점선 + 이름으로 잇는 미니 동선. 카드/바텀시트 공용. */
export function PlaceTrail({ places, className }: PlaceTrailProps) {
  return (
    <div className={`flex items-start gap-2 ${className ?? ''}`}>
      {places.map((place, index) => (
        <Fragment key={place.id}>
          {index > 0 && (
            <span className="mt-3 h-0 flex-1 border-t border-dashed border-[#8d8d8d]" />
          )}
          <div className="flex w-16 flex-col items-center gap-1">
            <EmojiFace className="h-6 w-6" />
            <p className="truncate text-xs font-medium text-[#111]">{place.name}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
