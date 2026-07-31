import { buildCalendarWeeks, toCalendarDate } from '../lib/calendar';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function columnColor(column: number) {
  if (column === 5) return 'text-[#78A3FF]';
  if (column === 6) return 'text-[#FF8080]';
  return 'text-black';
}

type CalendarGridProps = {
  year: number;
  month: number;
  activityByDate?: Record<string, number>;
  activityIcon?: string;
  /**
   * 날짜 → 잔디 농도(level). 값이 있는 날만 색 원을 그린다.
   * `activityByDate` 는 "있다/없다" 만 표시하는 반면 이쪽은 농도를 나타낸다.
   */
  levelByDate?: Record<string, number>;
  /** level 을 색으로 바꾸는 표. 인덱스가 곧 level 이다 (0 번은 안 쓴다). */
  levelColors?: string[];
  startDate?: string;
  endDate?: string;
  onDateSelect?: (date: string) => void;
};

export function CalendarGrid({ year, month, activityByDate = {}, activityIcon, levelByDate, levelColors = [], startDate, endDate, onDateSelect }: CalendarGridProps) {
  const weeks = buildCalendarWeeks(year, month);
  // 농도 표시도 아이콘과 같은 높이를 쓴다 — 숫자 아래 한 칸이 더 필요하다
  const cellHeight = activityIcon || levelByDate ? 'h-14' : 'h-11';

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-[14px] font-bold">
        {WEEKDAYS.map((label, column) => <div key={label} className={columnColor(column)}>{label}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7">
        {weeks.flatMap((week, weekIndex) => week.map((day, column) => {
          if (!day) return <div key={`${weekIndex}-${column}`} className={cellHeight} />;

          const date = toCalendarDate(year, month, day);
          const isStart = date === startDate;
          const isEnd = date === endDate;
          const isInRange = Boolean(startDate && endDate && date > startDate && date < endDate);
          const activityCount = activityByDate[date] ?? 0;
          const level = levelByDate?.[date] ?? 0;
          const content = (
            <>
              <span className={`grid h-8 w-8 place-items-center rounded-full ${isStart || isEnd ? 'bg-[#788f4a] font-bold text-white' : columnColor(column)}`}>{day}</span>
              {level > 0
                ? <span className="mt-0.5 h-4 w-4 rounded-full" style={{ backgroundColor: levelColors[level] }} aria-label={`방문 기록 ${level}단계`} />
                : activityCount > 0 && (activityIcon
                  ? <img src={activityIcon} alt={`방문 기록 ${activityCount}개`} className="mt-0.5 h-4 w-4" />
                  : <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isStart || isEnd ? 'bg-white' : 'bg-[#788f4a]'}`} aria-label={`저장된 나무 ${activityCount}개`} />)}
            </>
          );

          const className = `flex ${cellHeight} flex-col items-center justify-start pt-0.5 ${isInRange ? 'bg-[#ecf6d8]' : ''}`;
          return onDateSelect ? (
            <button key={date} type="button" className={className} onClick={() => onDateSelect(date)} aria-pressed={isStart || isEnd || isInRange}>{content}</button>
          ) : (
            <div key={date} className={className}>{content}</div>
          );
        }))}
      </div>
    </div>
  );
}
