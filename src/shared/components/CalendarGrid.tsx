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
  startDate?: string;
  endDate?: string;
  onDateSelect?: (date: string) => void;
};

export function CalendarGrid({ year, month, activityByDate = {}, activityIcon, startDate, endDate, onDateSelect }: CalendarGridProps) {
  const weeks = buildCalendarWeeks(year, month);
  const cellHeight = activityIcon ? 'h-14' : 'h-11';

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
          const content = (
            <>
              <span className={`grid h-8 w-8 place-items-center rounded-full ${isStart || isEnd ? 'bg-[#879b54] font-bold text-white' : columnColor(column)}`}>{day}</span>
              {activityCount > 0 && (activityIcon
                ? <img src={activityIcon} alt={`방문 기록 ${activityCount}개`} className="mt-0.5 h-4 w-4" />
                : <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isStart || isEnd ? 'bg-white' : 'bg-[#879b54]'}`} aria-label={`저장된 나무 ${activityCount}개`} />)}
            </>
          );

          const className = `flex ${cellHeight} flex-col items-center justify-start pt-0.5 ${isInRange ? 'bg-[#edf5d9]' : ''}`;
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
