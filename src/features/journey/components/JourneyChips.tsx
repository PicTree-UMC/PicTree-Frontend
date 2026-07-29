import { Journey } from '../types/journey';

interface JourneyChipsProps {
  journeys: Journey[];
  selectedId: number | null;
  onSelect: (journey: Journey) => void;
}

/**
 * 저장된 동선을 가로 스크롤 칩으로 나열하는 셀렉터.
 * 선택된 칩만 세이지로 채워지고, 나머지는 아웃라인으로 둔다.
 * 스크롤바는 숨겨 칩 줄만 깔끔하게 보이게 한다.
 */
export function JourneyChips({ journeys, selectedId, onSelect }: JourneyChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {journeys.map((journey) => {
        const isSelected = journey.id === selectedId;
        return (
          <button
            key={journey.id}
            onClick={() => onSelect(journey)}
            aria-pressed={isSelected}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              isSelected
                ? 'bg-[#89986d] text-white'
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
