import { useState } from 'react';
import { CalendarGrid, CalendarMonthNav, NavBar } from '@/shared/components';
import { useMonthCursor } from '@/shared/hooks/useMonthCursor';
import { useTravelCalendar } from './hooks/useTravelCalendar';
import { useCalendarTrees } from './hooks/useCalendarTrees';
import { CALENDAR_LEVEL_COLORS } from './lib/calendarLevel';
import { GrassLegendSheet } from './components/GrassLegendSheet';
import { DayTreeList } from './components/DayTreeList';

/** 헤더 오른쪽 `i`. 뒤로가기와 같은 흰 원 위에 얹어 좌우 무게를 맞춘다. */
function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="잔디 색 안내"
      className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.75h.01" />
      </svg>
    </button>
  );
}

/**
 * 여행 캘린더 — 하루에 나무를 몇 그루 심었는지 잔디 농도로 보여주고, 날짜를 누르면
 * 그날 심은 나무를 아래에 늘어놓는다.
 *
 * **달력 얼개는 동선 만들기 ①단계(`RouteCalendar`)와 같다.** 예전에는 이 화면만 흰 카드
 * 안에 격자를 넣고, 헤더에 큼직한 `2026년 ▼` 피커를, 카드 안에 자체 구현한 `‹ 8월 ›` 줄을
 * 따로 뒀다 — 같은 앱의 두 달력이 테두리·연도 위치·꺾쇠 모양까지 전부 달라 보였다.
 * 지금은 크림 바닥 위에 공용 `CalendarMonthNav` + `CalendarGrid` 한 벌뿐이다.
 *
 * 잔디 색 안내는 헤더의 `i` → 바텀시트로 옮겼다. 늘 펼쳐 두던 패널이 달력 아래를 차지하고
 * 있었는데, 그 자리는 날짜를 눌렀을 때 뜨는 나무 목록의 것이다.
 */
export function TravelCalendarPage() {
  /*
   * 들어오면 이번 달이 보인다(`useMonthCursor` 의 기본값).
   *
   * ⚠️ 예전에는 2026·4 로 박혀 있었다. 그래서 8월에 들어가도 4월이 열렸다.
   *
   * 12월↔1월 넘김은 공용 훅이 맡는다 — 연·월을 따로 들고 손으로 넘기던 코드였다(#104).
   * 범위(min·max)는 안 준다: 동선 만들기와 달리 여기는 어느 달이든 열어 볼 수 있다.
   */
  const { year, month, goPrev, goNext } = useMonthCursor();

  // 달을 넘길 때마다 그 달치를 받는다 (queryKey 에 연·월이 들어 있어 캐시가 산다)
  const { levelByDate, countByDate, isPending, isError, refetch } = useTravelCalendar(year, month);

  const [legendOpen, setLegendOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  /*
    달을 넘기면 고른 날짜를 놓는다. 안 놓으면 8월을 보고 있는데 아래 목록만 7월 15일에
    남아 둘이 어긋난 채로 읽힌다. 렌더 중에 상태를 고치는 대신 파생값으로 처리한다 —
    선택은 '지금 보고 있는 달의 날짜일 때만' 살아 있다.
  */
  const visibleDate =
    pickedDate?.startsWith(`${year}-${String(month).padStart(2, '0')}`) ? pickedDate : null;

  /*
    나무 목록은 **날짜를 처음 누른 뒤에야** 받는다 — `/trees` 에 날짜 필터가 없어 전체를
    페이지 끝까지 훑는 호출이라, 잔디만 보고 나가는 사람에게 물릴 이유가 없다.

    거기에 **그날 나무가 0그루면 아예 안 받는다.** 캘린더가 개수를 함께 내려주게 되면서
    (`countByDate`) 빈 날인 걸 미리 알 수 있게 됐다 — 전에는 빈 날을 눌러도 나무 전체를
    끝까지 훑고 나서 "이 날 심은 나무가 없어요" 를 띄웠다.
    ⚠️ `?? 1` 이다. 아직 이 달을 못 받았으면 `undefined` 이고, 그때는 **모르니까 받는다** —
    0 으로 넘겨 버리면 있는 나무를 없다고 말하게 된다.
  */
  const visibleDayCount = visibleDate ? (countByDate[visibleDate] ?? 1) : 0;
  const treesQuery = useCalendarTrees(visibleDate !== null && visibleDayCount > 0);

  return (
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      <header className="px-5 pt-header">
        <NavBar
          onBack={() => window.history.back()}
          title="여행 캘린더"
          action={<InfoButton onClick={() => setLegendOpen(true)} />}
        />
      </header>

      <div className="mt-4 px-5">
        {isError ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <p className="text-center text-[15px] font-medium text-ink">
              캘린더를 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-[15px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : (
          /*
            불러오는 중에도 격자는 그린다. 날짜 칸은 연·월만으로 정해지므로
            잔디만 나중에 채워지면 되고, 통째로 비우면 달을 넘길 때마다 화면이 튄다.
          */
          <div className={isPending ? 'opacity-50 transition-opacity' : undefined}>
            <CalendarMonthNav year={year} month={month} onPrev={goPrev} onNext={goNext} />

            <CalendarGrid
              year={year}
              month={month}
              levelByDate={levelByDate}
              levelColors={CALENDAR_LEVEL_COLORS}
              /*
                고른 날은 연초록 원(GREEN-300)이다. 짙은 초록(`rangeStart`)을 안 쓰는 이유:
                흰 글자 위로 잔디가 겹쳐 깔리면서 숫자가 안 읽힌다 — 잔디는 숫자 뒤가 아니라
                **숫자와 같은 칸**에 그려지기 때문이다. 연초록 위 INK 는 7.9:1 로 안전하다.
              */
              selectedDates={visibleDate ? [visibleDate] : []}
              // 한 번 더 누르면 닫힌다 — 목록을 치우는 다른 길이 없다.
              onDateSelect={(date) => setPickedDate((current) => (current === date ? null : date))}
              /*
                개수를 그대로 읽어 준다 — 눈으로는 색 농도로 보이는 것이 '3그루' 라는 뜻이다.
                `잔디 3단계` 였는데, 단계는 우리 쪽 집계 용어라 듣는 사람에게는 뜻이 없다.
              */
              dateAriaLabel={(date, day) => {
                const count = countByDate[date] ?? 0;
                return `${month}월 ${day}일 ${count > 0 ? `나무 ${count}그루` : '기록 없음'}`;
              }}
            />
          </div>
        )}

        {visibleDate && (
          <DayTreeList
            date={visibleDate}
            trees={treesQuery.data?.[visibleDate] ?? []}
            // `isPending` 이 아니라 `isLoading` 이다 — 토큰이 없어 쿼리가 꺼져 있으면
            // `isPending` 은 영영 true 라 스피너가 멈추지 않는다.
            isPending={treesQuery.isLoading}
            isError={treesQuery.isError}
            onRetry={() => treesQuery.refetch()}
          />
        )}
      </div>

      {legendOpen && <GrassLegendSheet onClose={() => setLegendOpen(false)} />}
    </div>
  );
}
