import { useState } from "react";
import { CalendarGrid } from "../../shared/components";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import grassIcon from "./assets/icons/grass.svg";
import treeIcon from "./assets/icons/tree.svg";

const ACTIVITY: Record<string, number> = {
  "2026-04-01": 2,
  "2026-04-07": 3,
  "2026-04-08": 3,
};

/** 잔디 농도 범례. 색과 라벨이 짝이라 한곳에서 관리한다 (시안 기준). */
const GRASS_LEGEND = [
  { shade: "rgba(239,227,177,0.6)", label: "1곳" },
  { shade: "rgba(197,216,157,0.6)", label: "2곳" },
  { shade: "rgba(177,195,141,0.6)", label: "3~4곳" },
  { shade: "rgba(137,152,109,0.6)", label: "5곳+" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function TravelCalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // 1~12
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
      {/* 헤더 밴드 */}
      <header className="bg-[#C5D89D] px-5 pb-12 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-xl font-bold text-black">여행 캘린더</h1>
        </div>

        {/* 연도 + 피커 트리거 */}
        <div className="relative mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            aria-expanded={pickerOpen}
            aria-label="연·월 선택"
            className="flex items-center gap-1.5 text-2xl font-bold text-black"
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
                  <span className="text-base font-bold text-[#2C3930]">
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
                      className={`rounded-lg py-2 text-sm ${
                        m === month
                          ? "bg-[#C5D89D] font-bold text-[#2C3930]"
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
            <p className="text-xl font-bold text-black">{month}월</p>
            <button type="button" onClick={goNextMonth} aria-label="다음 달" className="p-1">
              <img src={chevronLeftIcon} alt="" className="h-[18px] w-[10px] rotate-180" />
            </button>
          </div>

          <CalendarGrid year={year} month={month} activityByDate={ACTIVITY} activityIcon={grassIcon} />
        </div>

        <div className="mt-4 rounded-xl bg-[#ECF6D8] px-5 py-4">
          <div className="flex items-center gap-2">
            <img src={treeIcon} alt="" className="h-5 w-5" />
            <p className="text-xs font-medium text-[#2C3930]">
              하루에 방문하는 수만큼 잔디가 진해져요
            </p>
          </div>
          {/*
            items-start 로 두고 적음·많음 에만 mt 를 준다. 라벨이 붙은 만큼
            열이 길어져도 두 글자는 점 높이(20px) 가운데에 계속 걸리게 하려는 것.
          */}
          <div className="mt-3 flex items-start justify-center gap-2.5">
            <span className="mt-[5px] text-[10px] text-black">적음</span>
            {GRASS_LEGEND.map(({ shade, label }) => (
              <span key={label} className="flex w-5 flex-col items-center gap-1">
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: shade }}
                />
                <span className="whitespace-nowrap text-[10px] leading-[10px] text-black">
                  {label}
                </span>
              </span>
            ))}
            <span className="mt-[5px] text-[10px] text-black">많음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
