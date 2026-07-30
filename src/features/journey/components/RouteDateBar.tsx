import { formatDateLabel } from '../lib/formatDate';

/** 날짜 관리 버튼 앞의 캘린더 아이콘. */
function CalendarIcon({ className }: { className?: string }) {
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
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M7.5 14h3M7.5 17.5h6" />
    </svg>
  );
}

interface RouteDateBarProps {
  selectedDates: string[];
  maxDates: number;
  onOpenDatePicker: () => void;
  onRemoveDate: (dateKey: string) => void;
}

/**
 * 지도 위에 떠 있는 날짜 관리 바.
 *
 * 예전 시안의 날짜 탭(전체 / 3월 31일 / 4월 1일 …)을 대체한다. 날짜는 캘린더에서 고르고,
 * 여기엔 고른 날짜만 칩으로 늘어놓는다. 칩을 누르면 그 날짜가 빠진다(화면설계서 1·6번).
 */
export function RouteDateBar({
  selectedDates,
  maxDates,
  onOpenDatePicker,
  onRemoveDate,
}: RouteDateBarProps) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 pt-3">
      <button
        type="button"
        onClick={onOpenDatePicker}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#2c3930] px-3 text-[13px] font-medium text-[#fffcef] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
      >
        <CalendarIcon className="h-4 w-4" />
        날짜 관리 {selectedDates.length}/{maxDates}일
      </button>

      {selectedDates.length > 0 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          {selectedDates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => onRemoveDate(date)}
              aria-label={`${formatDateLabel(date)} 동선 빼기`}
              className="shrink-0 rounded-[10px] bg-[#fffcef]/90 px-4 py-1.5 text-[15px] font-medium text-[#2c3930] shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
            >
              {formatDateLabel(date)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
