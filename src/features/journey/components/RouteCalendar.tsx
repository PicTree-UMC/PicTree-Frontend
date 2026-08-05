import { useMemo } from 'react';
import { CalendarGrid, CalendarMonthNav } from '@/shared/components';
import { useMonthCursor } from '@/shared/hooks/useMonthCursor';

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
 * 격자와 달 이동은 공용(`CalendarGrid`·`CalendarMonthNav`)이다. 여기 남은 건 **이 화면에만
 * 있는 규칙** 뿐 — 이동 범위를 데이터가 정하고, 나무를 심은 날만 고를 수 있다.
 */
export function RouteCalendar({ placeCountByDate, selectedDates, onSelect }: RouteCalendarProps) {
  // 이동 범위는 데이터가 정한다 — 방문 기록이 있는 가장 이른 달부터 이번 달까지. 그 밖으로는
  // 고를 날짜가 없으므로 버튼을 잠근다.
  const { min, max } = useMemo(() => {
    const today = new Date();
    const thisMonth = { year: today.getFullYear(), month: today.getMonth() + 1 };
    const keys = [...placeCountByDate.keys()].sort();

    if (keys.length === 0) return { min: thisMonth, max: thisMonth };

    const [year, month] = keys[0].split('-').map(Number);
    // 기록이 미래 날짜에 있어도(기기 시계가 어긋난 경우) 범위가 뒤집히지 않게 한다.
    const earliest = { year, month };
    const isAfterThisMonth =
      year * 12 + month > thisMonth.year * 12 + thisMonth.month;
    return { min: isAfterThisMonth ? thisMonth : earliest, max: thisMonth };
  }, [placeCountByDate]);

  /*
    앞 화면에서 되돌아온 경우엔 이미 고른 날짜가 있는 달에서 시작해야 선택이 눈에 보인다.
    그 외에는 가장 최근 달 — 방금 다녀온 여행을 엮는 게 보통이라 옛 달부터 열 이유가 없다.

    매 렌더 계산해도 되는 값이다. `useMonthCursor` 는 이걸 **첫 렌더에만** 읽으므로,
    이후 선택이 바뀌어도 보고 있던 달을 뺏지 않는다.
  */
  const anchor = selectedDates.length > 0 ? [...selectedDates].sort()[0] : null;
  const [anchorYear, anchorMonth] = anchor ? anchor.split('-').map(Number) : [];
  const cursor = useMonthCursor({
    initial: anchor ? { year: anchorYear, month: anchorMonth } : max,
    min,
    max,
  });

  return (
    <div>
      <CalendarMonthNav
        year={cursor.year}
        month={cursor.month}
        onPrev={cursor.goPrev}
        onNext={cursor.goNext}
        canGoPrev={cursor.canGoPrev}
        canGoNext={cursor.canGoNext}
      />

      <CalendarGrid
        year={cursor.year}
        month={cursor.month}
        selectedDates={selectedDates}
        // 나무를 심은 날(장소가 있는 날)만 고를 수 있다 — 화면설계서 1번.
        isDateDisabled={(date) => !placeCountByDate.has(date)}
        onDateSelect={onSelect}
        // 칸에서 뺀 장소 수는 눈에는 안 보여도 읽어는 준다 — 화면 낭독으로 달력을 훑을 때는
        // 아래 미리보기 줄까지 내려갔다 오는 비용이 크다.
        dateAriaLabel={(date, day) => {
          const placeCount = placeCountByDate.get(date) ?? 0;
          return `${cursor.month}월 ${day}일 ${placeCount > 0 ? `장소 ${placeCount}곳` : '기록 없음'}`;
        }}
      />
    </div>
  );
}
