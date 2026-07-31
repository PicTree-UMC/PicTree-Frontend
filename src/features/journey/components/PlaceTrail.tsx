import { Fragment } from 'react';
import { Place } from '../types/journey';

/**
 * 기분 이모지가 없는 장소의 대체 얼굴(디자인 image 20). 인라인 SVG.
 *
 * mood 는 나무를 심을 때 고르는 값이라 항상 있을 것으로 보이지만, 스웨거상 필수가
 * 아니고 예전 데이터에 없을 수 있어 자리를 비우지 않도록 남겨둔다.
 */
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
      {/* 서버가 장소 식별자를 주지 않는다(이름·기분뿐). 순서가 곧 동선이라 index 를 키로 쓴다. */}
      {places.map((place, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className="mt-3 h-0 flex-1 border-t border-dashed border-[#60655c]" />
          )}
          <div className="flex w-16 flex-col items-center gap-1">
            {/* 사용자가 나무를 심을 때 고른 기분 이모지. SVG 얼굴과 높이(24px)를 맞춘다. */}
            {place.mood ? (
              <span className="h-6 text-[21px] leading-6" aria-hidden>
                {place.mood}
              </span>
            ) : (
              <EmojiFace className="h-6 w-6" />
            )}
            <p className="truncate text-xs font-medium text-[#111]">{place.name}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
