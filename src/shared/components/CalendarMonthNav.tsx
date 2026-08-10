function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

type CalendarMonthNavProps = {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  /** 범위 밖이면 잠근다. 안 넘기면 항상 열려 있다. */
  canGoPrev?: boolean;
  canGoNext?: boolean;
};

/**
 * 달력 위의 `‹ 2026년 4월 ›` 줄.
 *
 * `aria-live` 는 제목에 붙인다 — 화면 낭독으로 달을 넘길 때 **버튼에 머문 채로** 어느 달로
 * 갔는지 들려야 한다. 넘어간 뒤 격자까지 내려가 첫 날짜를 읽게 하면 이동이 확인되지 않는다.
 */
export function CalendarMonthNav({ year, month, onPrev, onNext, canGoPrev = true, canGoNext = true }: CalendarMonthNavProps) {
  return (
    <div className="mb-4 flex items-center justify-center gap-8">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="이전 달"
        className="p-1 text-ink disabled:text-ink-disabled"
      >
        <ChevronIcon className="h-5 w-5" />
      </button>
      <p className="text-[17px] font-medium text-ink" aria-live="polite">
        {year}년 {month}월
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="다음 달"
        className="p-1 text-ink disabled:text-ink-disabled"
      >
        <ChevronIcon className="h-5 w-5 rotate-180" />
      </button>
    </div>
  );
}
