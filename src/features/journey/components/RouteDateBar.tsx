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
  /** 그날 장소가 전부 꺼져 있는 날짜. 칩은 남고 반투명해진다(화면설계서 6·7번). */
  disabledDates: ReadonlySet<string>;
  maxDates: number;
  /**
   * 캘린더 열기. **저장된 동선을 볼 때는 넘기지 않는다** — 동선이 날짜를 이미 들고 있어서
   * 고를 게 없다. 없으면 `날짜 관리` 버튼째 사라지고 칩만 남는다.
   */
  onOpenDatePicker?: () => void;
  onToggleDate: (dateKey: string) => void;
}

/**
 * 지도 위에 떠 있는 날짜 관리 바.
 *
 * 예전 시안의 날짜 탭(전체 / 3월 31일 / 4월 1일 …)을 대체한다. 날짜는 캘린더에서 고르고,
 * 여기엔 고른 날짜만 칩으로 늘어놓는다. 칩을 누르면 그날 동선이 꺼진다(화면설계서 1·6번).
 *
 * **꺼진 날짜도 칩은 남긴다** — 지워버리면 되돌릴 길이 캘린더뿐이라, 반투명하게 두고
 * 다시 누르면 살아나게 한다. `n/3일` 은 캘린더에서 고른 날짜 수라 꺼도 줄지 않는다
 * (줄이면 3/3 인데 캘린더는 4번째를 막는 모순이 생긴다). 줄어드는 건 아래 장소 개수다.
 */
export function RouteDateBar({
  selectedDates,
  disabledDates,
  maxDates,
  onOpenDatePicker,
  onToggleDate,
}: RouteDateBarProps) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 pt-3">
      {onOpenDatePicker && (
        <button
          type="button"
          onClick={onOpenDatePicker}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#2c3930] px-3 text-[13px] font-medium text-[#fffcef] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
        >
          <CalendarIcon className="h-4 w-4" />
          날짜 관리 {selectedDates.length}/{maxDates}일
        </button>
      )}

      {selectedDates.length > 0 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          {selectedDates.map((date) => {
            const disabled = disabledDates.has(date);

            return (
              <button
                key={date}
                type="button"
                onClick={() => onToggleDate(date)}
                aria-pressed={!disabled}
                aria-label={`${formatDateLabel(date)} 동선 ${disabled ? '켜기' : '끄기'}`}
                className={`shrink-0 rounded-[10px] px-4 py-1.5 text-[15px] font-medium transition-colors ${
                  disabled
                    ? 'bg-[#fffcef]/45 text-[#2c3930]/40'
                    : 'bg-[#fffcef]/90 text-[#2c3930] shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
                }`}
              >
                {formatDateLabel(date)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
