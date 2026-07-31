import { useEffect, useMemo, useState } from 'react';
import {
  buildMonthRange,
  parseDateKey,
  toDateKey,
  WEEKDAY_LABELS,
  type CalendarMonth,
} from '../lib/calendar';

/** 팔레트에 없는 색. 시안에서 눈으로 딴 값이라 확정 값이 나오면 여기만 고치면 된다. */
const SATURDAY = '#4a7fe0';
const SUNDAY = '#e5484d';

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

interface DayCellProps {
  dateKey: string;
  day: number;
  weekday: number; // 0=월 … 6=일
  placeCount: number;
  selected: boolean;
  onSelect: (dateKey: string) => void;
}

function DayCell({ dateKey, day, weekday, placeCount, selected, onSelect }: DayCellProps) {
  const numberColor = weekday === 5 ? SATURDAY : weekday === 6 ? SUNDAY : '#111';

  return (
    <button
      type="button"
      // 나무를 심은 날(장소가 있는 날)만 고를 수 있다 — 화면설계서 1번.
      disabled={placeCount === 0}
      onClick={() => onSelect(dateKey)}
      aria-pressed={selected}
      className={`mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-[10px] ${
        selected ? 'bg-[#c5d89d]' : ''
      }`}
    >
      <span className="text-[15px] leading-none" style={{ color: numberColor }}>
        {day}
      </span>
      {placeCount > 0 && (
        <span className="mt-0.5 text-[10px] leading-none text-[#60655c]">{placeCount}곳</span>
      )}
    </button>
  );
}

interface MonthGridProps {
  month: CalendarMonth;
  placeCountByDate: Map<string, number>;
  selectedDates: string[];
  onSelect: (dateKey: string) => void;
}

function MonthGrid({ month, placeCountByDate, selectedDates, onSelect }: MonthGridProps) {
  return (
    <section className="mb-7">
      <h3 className="mb-3 text-[15px] font-medium text-[#111]">
        {month.year}년 {month.month}월
      </h3>

      <div className="grid grid-cols-7 gap-y-2">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={label}
            className="text-center text-[13px] font-medium"
            style={{ color: index === 5 ? SATURDAY : index === 6 ? SUNDAY : '#111' }}
          >
            {label}
          </span>
        ))}

        {Array.from({ length: month.blanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}

        {month.days.map((day) => {
          const dateKey = toDateKey(month.year, month.month, day);
          return (
            <DayCell
              key={dateKey}
              dateKey={dateKey}
              day={day}
              weekday={(month.blanks + day - 1) % 7}
              placeCount={placeCountByDate.get(dateKey) ?? 0}
              selected={selectedDates.includes(dateKey)}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </section>
  );
}

interface RouteDateSheetProps {
  /** 날짜별 방문 장소 수. 여기 없는 날짜는 고를 수 없다. */
  placeCountByDate: Map<string, number>;
  selectedDates: string[];
  selectedPlaceCount: number;
  maxDates: number;
  maxPlaces: number;
  onToggleDate: (dateKey: string) => void;
  onSelectFirstDates: () => void;
  onClearDates: () => void;
  onClose: () => void;
}

/**
 * 날짜 관리 캘린더(화면설계서 1·3·4번).
 *
 * 달 범위는 데이터가 정한다 — 방문 기록이 있는 가장 이른 달부터 이번 달까지. 기록이 없으면
 * 이번 달만 그린다. 시트 높이를 고정하고 안쪽 달 목록만 스크롤해서, 경고 문구가 떠도
 * 헤더·버튼 위치가 흔들리지 않게 했다.
 */
export function RouteDateSheet({
  placeCountByDate,
  selectedDates,
  selectedPlaceCount,
  maxDates,
  maxPlaces,
  onToggleDate,
  onSelectFirstDates,
  onClearDates,
  onClose,
}: RouteDateSheetProps) {
  // 0 이면 숨김. 그 외에는 '몇 번째 시도인지'를 담아 문구의 key 로 쓴다 — 문구가 이미 떠 있을 때
  // 또 누르면 DOM 이 그대로라 흔들림이 다시 재생되지 않기 때문이다.
  const [limitAttempt, setLimitAttempt] = useState(0);

  const months = useMemo(() => {
    const keys = [...placeCountByDate.keys()].sort();
    const today = new Date();
    return buildMonthRange(keys.length > 0 ? parseDateKey(keys[0]) : today, today);
  }, [placeCountByDate]);

  // 경고는 잠깐만 띄운다. 3일을 채운 채 시트에 머무르면 계속 남아 있는 게 이상하다.
  // 다시 누르면 attempt 가 올라가 타이머도 처음부터 다시 간다.
  useEffect(() => {
    if (limitAttempt === 0) return;
    const timer = window.setTimeout(() => setLimitAttempt(0), 3000);
    return () => window.clearTimeout(timer);
  }, [limitAttempt]);

  const handleSelect = (dateKey: string) => {
    // 한도는 시트가 지킨다 — 안내 문구를 띄우는 곳과 같은 자리에 두는 게 덜 어긋난다.
    if (!selectedDates.includes(dateKey) && selectedDates.length >= maxDates) {
      setLimitAttempt((attempt) => attempt + 1);
      // 흔들림만으로는 화면을 안 보고 있으면 놓친다. iOS 사파리는 이 API 가 없어서 조용히 넘어간다.
      navigator.vibrate?.(20);
      return;
    }
    setLimitAttempt(0);
    onToggleDate(dateKey);
  };

  return (
    <>
      {/* SaveRouteSheet 과 같은 규칙 — 뒤를 어둡게 깔지 않고 바깥 탭으로만 닫는다. */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+104px)] z-50 mx-auto flex w-full flex-col rounded-t-[24px] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] sm:max-w-[390px]">
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <h2 className="text-[17px] font-medium text-[#111]">날짜 관리</h2>
            {/* 한도에 막히면 이 줄이 흔들린다. 새로 뜨는 문구는 등장 자체가 움직임이라
                흔들려도 눈에 안 들어와서, 계속 떠 있던 요소를 흔들어야 신호가 된다.
                key 로 다시 마운트시켜야 연달아 눌렀을 때도 매번 재생된다. */}
            <p
              key={limitAttempt}
              className={`mt-1 text-[13px] text-[#60655c] ${
                limitAttempt > 0 ? 'motion-safe:animate-shake' : ''
              }`}
            >
              선택한 날짜 {selectedDates.length}/{maxDates}일 · 선택한 장소 {selectedPlaceCount}/
              {maxPlaces}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="-mr-1 p-1 text-[#111]">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 px-5">
          <button
            type="button"
            onClick={() => {
              setLimitAttempt(0);
              onSelectFirstDates();
            }}
            className="h-11 rounded-[8px] bg-[#fffcef] text-[15px] font-medium text-[#2c3930] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          >
            앞의 {maxDates}일 선택
          </button>
          <button
            type="button"
            onClick={() => {
              setLimitAttempt(0);
              onClearDates();
            }}
            className="h-11 rounded-[8px] bg-[#fffcef] text-[15px] font-medium text-[#2c3930] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          >
            전체 해제
          </button>
        </div>

        {limitAttempt > 0 && (
          // key: 문구가 떠 있는 채로 또 막히면 다시 흔들리게 강제로 다시 마운트한다.
          // 한 줄 안에 들어가야 해서 문구를 줄였다 — 13px 을 지키면서 320px 폭에도 안 접힌다.
          <p
            key={limitAttempt}
            role="alert"
            className="mt-3 whitespace-nowrap px-5 text-[13px] motion-safe:animate-shake"
            style={{ color: SUNDAY }}
          >
            최대 {maxDates}일까지 선택할 수 있어요
          </p>
        )}

        <div className="mt-5 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {months.map((month) => (
            <MonthGrid
              key={`${month.year}-${month.month}`}
              month={month}
              placeCountByDate={placeCountByDate}
              selectedDates={selectedDates}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </>
  );
}
