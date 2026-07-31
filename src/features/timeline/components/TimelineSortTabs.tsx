import { TIMELINE_SORTS, type TimelineSort } from "../lib/timelineQuery";

interface Props {
  value: TimelineSort;
  onChange: (sort: TimelineSort) => void;
}

/**
 * 최신순 / 등록순 전환.
 *
 * 라디오 그룹으로 노출한다 — 버튼 두 개를 나열하면 스크린리더가 "무엇 중 하나를
 * 고르는 상황" 인지 알 수 없다.
 */
export function TimelineSortTabs({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="정렬 기준" className="flex items-center gap-1">
      {TIMELINE_SORTS.map(({ key, label }) => {
        const isActive = key === value;

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(key)}
            className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
              isActive
                ? "bg-[#C5D89D] font-bold text-[#2C3930]"
                : "text-[#60655C]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
