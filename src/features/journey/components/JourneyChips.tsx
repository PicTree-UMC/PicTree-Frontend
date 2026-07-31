import { useEffect, useRef } from 'react';
import { Journey } from '../types/journey';

interface JourneyChipsProps {
  journeys: Journey[];
  selectedId: number | null;
  onSelect: (journey: Journey) => void;
}

/** 선택된 칩이 스크롤 밖으로 나갔을 때 남기는 여백. */
const SCROLL_MARGIN = 16;

/**
 * 저장된 동선을 가로 스크롤 칩으로 나열하는 셀렉터.
 * 선택된 칩만 세이지로 채워지고, 나머지는 아웃라인으로 둔다.
 * 스크롤바는 숨겨 칩 줄만 깔끔하게 보이게 한다.
 *
 * 동선이 많아지면 선택된 칩이 화면 밖에 있을 수 있어 가로로 끌어온다 — 저장 직후처럼
 * 사용자가 직접 누르지 않고 선택이 바뀌는 경우에 필요하다(안 하면 아무것도 안 고른 것처럼 보인다).
 *
 * ⚠️ `scrollIntoView` 를 쓰지 않는다 — 조상 스크롤 컨테이너까지 세로로 움직일 수 있다.
 * 이 컨테이너의 `scrollLeft` 만 건드린다.
 */
export function JourneyChips({ journeys, selectedId, onSelect }: JourneyChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = selectedRef.current;
    if (!scroller || !chip) return;

    const chipRight = chip.offsetLeft + chip.offsetWidth;
    const viewRight = scroller.scrollLeft + scroller.clientWidth;

    // 이미 보이는 칩이면 아무것도 하지 않는다 — 누를 때마다 줄이 흔들리면 안 된다.
    if (chip.offsetLeft < scroller.scrollLeft) {
      scroller.scrollTo({ left: chip.offsetLeft - SCROLL_MARGIN, behavior: 'smooth' });
    } else if (chipRight > viewRight) {
      scroller.scrollTo({
        left: chipRight - scroller.clientWidth + SCROLL_MARGIN,
        behavior: 'smooth',
      });
    }
  }, [selectedId]);

  return (
    <div
      ref={scrollerRef}
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {journeys.map((journey) => {
        const isSelected = journey.id === selectedId;
        return (
          <button
            key={journey.id}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onSelect(journey)}
            aria-pressed={isSelected}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              isSelected
                ? 'bg-[#788f4a] text-white'
                : 'border border-[#c5d89d] bg-white text-[#2c3930]'
            }`}
          >
            {journey.title}
          </button>
        );
      })}
    </div>
  );
}
