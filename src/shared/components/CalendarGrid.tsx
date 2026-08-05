import { buildCalendarWeeks, toCalendarDate } from '../lib/calendar';

/** 첫 열은 일요일(`buildCalendarWeeks` 와 같은 약속). */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/*
  주말 색은 한국 달력 관례(일 빨강 · 토 파랑)를 따른다. 대비가 낮지만 **데코 액센트**로
  본다 — 날짜 숫자는 위치로도 읽히고, 색은 '주말이구나' 만 거든다.
*/
const SUNDAY = '#FF8080';
const SATURDAY = '#78A3FF';
const INK = '#2c3930';
/** 고를 수 없는 날. 색을 흐리게(opacity) 하지 않고 회색으로 바꾼다 — 흐린 빨강은 분홍으로 읽힌다. */
const DISABLED = '#b4b4b4';

function weekdayColor(column: number) {
  if (column === 0) return SUNDAY;
  if (column === 6) return SATURDAY;
  return INK;
}

type CalendarGridProps = {
  year: number;
  month: number;
  /** 여러 날 고르기. 고른 날은 연초록 원이 된다. */
  selectedDates?: string[];
  /** 기간 고르기. 양 끝은 짙은 초록 원, 사이는 연초록 띠. */
  rangeStart?: string;
  rangeEnd?: string;
  /**
   * 고를 수 없는 날. 여기서는 **주말 색도 쓰지 않는다** — 못 누르는 날짜가 제일 튀는 색을
   * 갖는 게 이상하고, 달력의 대비를 '고를 수 있나' 에만 쓰는 편이 훑어보기 쉽다.
   */
  isDateDisabled?: (date: string) => boolean;
  onDateSelect?: (date: string) => void;
  /** 날짜별 기록 수 — 숫자 아래 점(또는 아이콘)으로 **있다/없다**만 표시한다. */
  activityByDate?: Record<string, number>;
  activityIcon?: string;
  /**
   * 날짜 → 잔디 농도(level). 값이 있는 날만 색 원을 그린다.
   * `activityByDate` 가 있다/없다면 이쪽은 **얼마나** 를 진하기로 나타낸다.
   */
  levelByDate?: Record<string, number>;
  /** level 을 색으로 바꾸는 표. 인덱스가 곧 level 이다 (0 번은 안 쓴다). */
  levelColors?: string[];
  /** 칸의 화면 낭독 문구. 기본은 `n월 n일`. */
  dateAriaLabel?: (date: string, day: number) => string;
};

/**
 * 한 달치 날짜 격자.
 *
 * 여행 캘린더(잔디) · 블로그 기간 선택(범위) · 동선 날짜 고르기(여러 날 + 고를 수 없는 날)가
 * 각자 격자를 그리고 있었다(#104). 요일 줄·주말 색·빈 칸 채우기·a11y 속성이 전부 달라서
 * 같은 달인데 화면마다 다르게 보였다. **격자는 여기 하나뿐이고, 달 이동과 바깥 틀은 화면 몫.**
 */
export function CalendarGrid({
  year,
  month,
  selectedDates,
  rangeStart,
  rangeEnd,
  isDateDisabled,
  onDateSelect,
  activityByDate = {},
  activityIcon,
  levelByDate,
  levelColors = [],
  dateAriaLabel,
}: CalendarGridProps) {
  const weeks = buildCalendarWeeks(year, month);
  // 점·잔디는 숫자 아래 한 칸을 더 쓴다.
  const cellHeight = activityIcon || levelByDate ? 'h-14' : 'h-11';

  return (
    <div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((label, column) => (
          <span key={label} className="text-[13px] font-medium" style={{ color: weekdayColor(column) }}>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7">
        {weeks.flatMap((week, weekIndex) =>
          week.map((day, column) => {
            if (!day) return <div key={`blank-${weekIndex}-${column}`} className={cellHeight} />;

            const date = toCalendarDate(year, month, day);
            const disabled = isDateDisabled?.(date) ?? false;
            const isEdge = date === rangeStart || date === rangeEnd;
            const isInRange = Boolean(rangeStart && rangeEnd && date > rangeStart && date < rangeEnd);
            const isPicked = selectedDates?.includes(date) ?? false;
            const activityCount = activityByDate[date] ?? 0;
            const level = levelByDate?.[date] ?? 0;

            /*
              범위 양 끝은 흰 글자를 얹으므로 **GREEN-700** 이다. 예전엔 GREEN-500(#788f4a)
              이었는데 흰 글자와 3.5:1 로 기준에 못 미쳤다(#147 에서 정리한 규칙 — 500 은
              면·테두리 전용).
            */
            const numberClass = isEdge
              ? 'bg-[#5B6B38] text-white'
              : isPicked
                ? 'bg-[#C5D89D]'
                : '';
            const numberColor = disabled ? DISABLED : isEdge ? undefined : weekdayColor(column);

            const content = (
              <>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-[15px] leading-none ${numberClass}`}
                  style={{ color: numberColor }}
                >
                  {day}
                </span>
                {level > 0 ? (
                  <span
                    className="mt-0.5 h-4 w-4 rounded-full"
                    style={{ backgroundColor: levelColors[level] }}
                    aria-label={`방문 기록 ${level}단계`}
                  />
                ) : (
                  activityCount > 0 &&
                  (activityIcon ? (
                    <img src={activityIcon} alt={`방문 기록 ${activityCount}개`} className="mt-0.5 h-4 w-4" />
                  ) : (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isEdge ? 'bg-white' : 'bg-[#5B6B38]'}`}
                      aria-label={`저장된 나무 ${activityCount}개`}
                    />
                  ))
                )}
              </>
            );

            const className = `flex ${cellHeight} flex-col items-center justify-start pt-0.5 ${
              isInRange ? 'bg-[#ECF6D8]' : ''
            }`;

            return onDateSelect ? (
              <button
                key={date}
                type="button"
                className={className}
                disabled={disabled}
                onClick={() => onDateSelect(date)}
                aria-pressed={isEdge || isInRange || isPicked}
                aria-label={dateAriaLabel?.(date, day) ?? `${month}월 ${day}일`}
              >
                {content}
              </button>
            ) : (
              <div key={date} className={className}>
                {content}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
