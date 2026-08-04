import { useMemo, useState } from 'react';
import { buildCalendarWeeks, toCalendarDate } from '@/shared/lib/calendar';

/** 팔레트에 없는 색. 시안에서 눈으로 딴 값이라 확정 값이 나오면 여기만 고치면 된다. */
const SATURDAY = '#4a7fe0';
const SUNDAY = '#e5484d';

/** 일요일 시작. 첫 열이 일요일이라 주말 색은 양 끝(0=일 빨강, 6=토 파랑)에 붙는다. */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const weekdayColor = (column: number) =>
  column === 0 ? SUNDAY : column === 6 ? SATURDAY : '#2c3930';

/** 연·월을 한 숫자로 눌러 비교·증감을 쉽게 한다(2026-04 → 24315). */
const toMonthIndex = (year: number, month: number) => year * 12 + (month - 1);
const fromMonthIndex = (index: number) => ({
  year: Math.floor(index / 12),
  month: (index % 12) + 1,
});

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

interface RouteCalendarProps {
  /** 날짜별 방문 장소 수. 여기 없는 날짜는 고를 수 없다. */
  placeCountByDate: Map<string, number>;
  selectedDates: string[];
  onSelect: (dateKey: string) => void;
}

/**
 * 한 번에 한 달만 보여주는 달력(화면설계서 1번).
 *
 * **예전에는 기록이 있는 달을 전부 세로로 이어 붙였다** — 몇 달 전을 보려면 계속 스크롤해야
 * 했고, 지금 어느 달을 보고 있는지도 스크롤 위치에 달려 있었다. 프로필 여행 달력과 같은
 * 방식(가운데 제목 + 좌우 이동)으로 바꿔 한 달이 한 화면에 들어오게 한다.
 *
 * 이동 범위는 데이터가 정한다 — 방문 기록이 있는 가장 이른 달부터 이번 달까지. 그 밖으로는
 * 고를 날짜가 없으므로 버튼을 잠근다.
 */
export function RouteCalendar({ placeCountByDate, selectedDates, onSelect }: RouteCalendarProps) {
  const { first, last } = useMemo(() => {
    const today = new Date();
    const lastIndex = toMonthIndex(today.getFullYear(), today.getMonth() + 1);
    const keys = [...placeCountByDate.keys()].sort();

    if (keys.length === 0) return { first: lastIndex, last: lastIndex };

    const [year, month] = keys[0].split('-').map(Number);
    // 기록이 미래 날짜에 있어도(기기 시계가 어긋난 경우) 범위가 뒤집히지 않게 한다.
    return { first: Math.min(toMonthIndex(year, month), lastIndex), last: lastIndex };
  }, [placeCountByDate]);

  const [cursor, setCursor] = useState(() => {
    // 앞 화면에서 되돌아온 경우엔 이미 고른 날짜가 있는 달에서 시작해야 선택이 눈에 보인다.
    // 그 외에는 가장 최근 달 — 방금 다녀온 여행을 엮는 게 보통이라 옛 달부터 열 이유가 없다.
    const anchor = selectedDates.length > 0 ? [...selectedDates].sort()[0] : null;
    if (!anchor) return last;

    const [year, month] = anchor.split('-').map(Number);
    return Math.min(Math.max(toMonthIndex(year, month), first), last);
  });

  const { year, month } = fromMonthIndex(cursor);
  const weeks = buildCalendarWeeks(year, month, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => setCursor((current) => Math.max(current - 1, first))}
          disabled={cursor <= first}
          aria-label="이전 달"
          className="p-1 text-[#2c3930] disabled:text-[#b4b4b4]"
        >
          <ChevronIcon className="h-5 w-5" />
        </button>
        <p className="text-[17px] font-medium text-[#2c3930]" aria-live="polite">
          {year}년 {month}월
        </p>
        <button
          type="button"
          onClick={() => setCursor((current) => Math.min(current + 1, last))}
          disabled={cursor >= last}
          aria-label="다음 달"
          className="p-1 text-[#2c3930] disabled:text-[#b4b4b4]"
        >
          <ChevronIcon className="h-5 w-5 rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((label, column) => (
          <span key={label} className="text-[13px] font-medium" style={{ color: weekdayColor(column) }}>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {weeks.flatMap((week, weekIndex) =>
          week.map((day, column) => {
            if (!day) return <span key={`blank-${weekIndex}-${column}`} className="h-11" />;

            const dateKey = toCalendarDate(year, month, day);
            const placeCount = placeCountByDate.get(dateKey) ?? 0;
            const selected = selectedDates.includes(dateKey);
            /*
              고를 수 없는 날은 INK-disabled 한 색으로 눕힌다. 주말 색(파랑·빨강)도 여기서는
              쓰지 않는다 — 못 누르는 날짜가 오히려 제일 튀는 색을 갖는 게 이상하고, 달력의
              대비를 '고를 수 있나'에만 쓰는 편이 훑어보기 쉽다.
              투명도 대신 색을 바꾸는 이유: 빨강을 35% 로 깔면 흐린 분홍이 되어 여전히 색으로
              읽힌다(가이드라인도 텍스트에 opacity 를 쓰지 않는다).
            */
            const numberColor = placeCount === 0 ? '#b4b4b4' : weekdayColor(column);

            return (
              <button
                key={dateKey}
                type="button"
                // 나무를 심은 날(장소가 있는 날)만 고를 수 있다 — 화면설계서 1번.
                disabled={placeCount === 0}
                onClick={() => onSelect(dateKey)}
                aria-pressed={selected}
                // 칸에서 뺀 장소 수는 눈에는 안 보여도 읽어는 준다 — 화면 낭독으로 달력을
                // 훑을 때는 아래 미리보기 줄까지 내려갔다 오는 비용이 크다.
                aria-label={`${month}월 ${day}일 ${placeCount > 0 ? `장소 ${placeCount}곳` : '기록 없음'}`}
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                  selected ? 'bg-[#c5d89d]' : ''
                }`}
              >
                <span className="text-[15px] leading-none" style={{ color: numberColor }}>
                  {day}
                </span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
