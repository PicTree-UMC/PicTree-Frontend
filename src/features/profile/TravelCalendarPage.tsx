import { useState } from "react";
import { CalendarGrid } from "../../shared/components";
import { useTravelCalendar } from "./hooks/useTravelCalendar";
import { CALENDAR_LEVELS, CALENDAR_LEVEL_COLORS } from "./lib/calendarLevel";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import treeIcon from "./assets/icons/tree.svg";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function TravelCalendarPage() {
  /*
   * 들어오면 이번 달이 보인다.
   *
   * 초기값을 렌더마다 새로 만들지 않도록 함수형 초기화를 쓴다. `new Date()` 를
   * 그냥 넘기면 매 렌더 호출되는데, 어차피 첫 렌더에만 쓰이므로 낭비다.
   *
   * ⚠️ 예전에는 2026·4 로 박혀 있었다. 그래서 8월에 들어가도 4월이 열렸다.
   */
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1); // 1~12

  // 달을 넘길 때마다 그 달치를 받는다 (queryKey 에 연·월이 들어 있어 캐시가 산다)
  const { levelByDate, isPending, isError, refetch } = useTravelCalendar(year, month);
  const [pickerOpen, setPickerOpen] = useState(false);

  const goPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };
  const goNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      {/* 헤더 밴드 — pt 의 safe-area 는 상태바 겹침 방지(#139) */}
      <header className="bg-[#C5D89D] px-5 pb-12 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-[20px] font-medium text-black">여행 캘린더</h1>
        </div>

        {/* 연도 + 피커 트리거 */}
        <div className="relative mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            aria-expanded={pickerOpen}
            aria-label="연·월 선택"
            className="flex items-center gap-1.5 text-2xl font-medium text-black"
          >
            {year}년
            {/* 역삼각형(▼) */}
            <svg
              width="14"
              height="9"
              viewBox="0 0 14 9"
              className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path
                d="M1 1l6 6 6-6"
                stroke="#111"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPickerOpen(false)}
              />
              <div className="absolute top-full z-30 mt-3 w-[280px] rounded-2xl bg-white p-4 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.14)]">
                <div className="mb-3 flex items-center justify-between px-2">
                  <button
                    type="button"
                    onClick={() => setYear(year - 1)}
                    aria-label="이전 해"
                    className="p-2"
                  >
                    <img src={chevronLeftIcon} alt="" className="h-4 w-[9px]" />
                  </button>
                  <span className="text-[15px] font-medium text-[#2C3930]">
                    {year}년
                  </span>
                  <button
                    type="button"
                    onClick={() => setYear(year + 1)}
                    aria-label="다음 해"
                    className="p-2"
                  >
                    <img src={chevronLeftIcon} alt="" className="h-4 w-[9px] rotate-180" />
                  </button>
                </div>
                {/* 월 선택 */}
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMonth(m);
                        setPickerOpen(false);
                      }}
                      className={`rounded-lg py-2 text-[14px] ${
                        m === month
                          ? "bg-[#C5D89D] font-medium text-[#2C3930]"
                          : "text-[#2C3930]"
                      }`}
                    >
                      {m}월
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="px-5">
        <div className="-mt-6 rounded-[20px] bg-white p-5 shadow-[4px_4px_8px_0px_rgba(0,0,0,0.12)]">
          <div className="mb-4 flex items-center justify-center gap-8">
            <button type="button" onClick={goPrevMonth} aria-label="이전 달" className="p-1">
              <img src={chevronLeftIcon} alt="" className="h-[18px] w-[10px]" />
            </button>
            <p className="text-[20px] font-medium text-black">{month}월</p>
            <button type="button" onClick={goNextMonth} aria-label="다음 달" className="p-1">
              <img src={chevronLeftIcon} alt="" className="h-[18px] w-[10px] rotate-180" />
            </button>
          </div>

          {isError ? (
            <div className="py-8 text-center">
              <p className="text-[14px] text-[#FF5858]">캘린더를 불러오지 못했어요.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 rounded-xl bg-[#89986D] px-4 py-1.5 text-[13px] font-medium text-white"
              >
                다시 시도
              </button>
            </div>
          ) : (
            /*
              불러오는 중에도 격자는 그린다. 날짜 칸은 연·월만으로 정해지므로
              잔디만 나중에 채워지면 되고, 통째로 비우면 달을 넘길 때마다 화면이 튄다.
            */
            <div className={isPending ? "opacity-50 transition-opacity" : undefined}>
              <CalendarGrid
                year={year}
                month={month}
                levelByDate={levelByDate}
                levelColors={CALENDAR_LEVEL_COLORS}
              />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-[#ECF6D8] px-5 py-4">
          <div className="flex items-center gap-2">
            <img src={treeIcon} alt="" className="h-5 w-5" />
            <p className="text-[13px] font-medium text-[#2C3930]">
              하루에 방문하는 수만큼 잔디가 진해져요
            </p>
          </div>
          {/*
            items-start 로 두고 적음·많음 에만 mt 를 준다. 라벨이 붙은 만큼
            열이 길어져도 두 글자는 점 높이(20px) 가운데에 계속 걸리게 하려는 것.
          */}
          <div className="mt-3 flex items-start justify-center gap-2.5">
            <span className="mt-[5px] text-[13px] text-black">적음</span>
            {CALENDAR_LEVELS.map(({ shade, label }) => (
              <span key={label} className="flex w-5 flex-col items-center gap-1">
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: shade }}
                />
                <span className="whitespace-nowrap text-[13px] leading-[10px] text-black">
                  {label}
                </span>
              </span>
            ))}
            <span className="mt-[5px] text-[13px] text-black">많음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
