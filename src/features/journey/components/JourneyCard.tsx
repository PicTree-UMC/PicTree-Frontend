import { Journey } from '../types/journey';
import { PlaceTrail } from './PlaceTrail';

interface JourneyCardProps {
  journey: Journey;
  onDelete: (journey: Journey) => void;
  onClick: (journey: Journey) => void;
}

/** 삭제 버튼 안 휴지통 아이콘(디자인 ix:trashcan). 인라인 SVG. */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function JourneyCard({ journey, onDelete, onClick }: JourneyCardProps) {
  return (
    <article
      onClick={() => onClick(journey)}
      className="relative cursor-pointer rounded-[12px] border-2 border-[#c5d89d] bg-white px-5 pb-2.5 pt-3.5"
    >
      {/* 상단: 제목 + 날짜, 우측 삭제 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h3 className="truncate text-lg font-bold text-[#111]">{journey.title}</h3>
          <span className="shrink-0 text-xs font-medium text-[#2c3930]">{journey.date}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(journey);
          }}
          aria-label="동선 삭제"
          className="flex size-7 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-[#ff9797] text-[#ff9797]"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      {/* 장소: 이모지들을 점선으로 잇고 아래에 이름 */}
      <PlaceTrail places={journey.places} className="mt-3 px-1" />

      {/* 하단: 구분선 + 장소 수 / 저장일 */}
      <hr className="mt-2.5 border-t border-[#e5e5e5]" />
      <div className="mt-1.5 flex justify-between text-[10px] font-light text-[#8d8d8d]">
        <span>{journey.places.length}개 장소</span>
        <span>{journey.savedAt} 저장</span>
      </div>
    </article>
  );
}
