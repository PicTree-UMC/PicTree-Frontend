import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import grassIcon from "./assets/icons/grass.svg";
import treeIcon from "./assets/icons/tree.svg";

const YEAR = 2026;
const MONTH = 4; 

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const ACTIVITY: Record<number, number> = { 1: 2, 7: 3, 8: 3 };

// 잔디 진하기 
const GRASS_SHADES = [
  "rgba(239,227,177,0.6)", 
  "rgba(197,216,157,0.6)", 
  "rgba(177,195,141,0.6)", 
  "rgba(137,152,109,0.6)", 
];

function buildWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); 
  const lead = (firstWeekday + 6) % 7;
  const dayCount = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= dayCount; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function columnColor(col: number): string {
  if (col === 5) return "text-[#78A3FF]"; 
  if (col === 6) return "text-[#FF8080]"; 
  return "text-[#000000]";
}

export function TravelCalendarPage() {
  const weeks = buildWeeks(YEAR, MONTH);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF7] pb-28">
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
        <p className="mt-4 text-center text-2xl font-bold text-black">
          {YEAR}년
        </p>
      </header>

      <div className="px-5">
        <div className="-mt-6 rounded-[20px] bg-white p-5 shadow-[4px_4px_8px_0px_rgba(0,0,0,0.12)]">
          <p className="mb-4 text-center text-xl font-bold text-black">
            {MONTH}월
          </p>

          <div className="grid grid-cols-7 text-center text-base font-bold">
            {WEEKDAYS.map((label, col) => (
              <div key={label} className={columnColor(col)}>
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7">
            {weeks.map((week, wi) =>
              week.map((day, col) => (
                <div
                  key={`${wi}-${col}`}
                  className="flex h-11 flex-col items-center justify-start pt-1.5"
                >
                  {day && (
                    <>
                      <span className={`text-base ${columnColor(col)}`}>
                        {day}
                      </span>
                      {ACTIVITY[day] && (
                        <img
                          src={grassIcon}
                          alt="방문 기록"
                          className="mt-0.5 h-4 w-4"
                        />
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#ECF6D8] px-5 py-4">
          <div className="flex items-center gap-2">
            <img src={treeIcon} alt="" className="h-5 w-5" />
            <p className="text-xs font-medium text-[#2C3930]">
              하루에 방문하는 수만큼 잔디가 진해져요
            </p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2.5">
            <span className="text-[10px] font-medium text-black">적음</span>
            {GRASS_SHADES.map((shade) => (
              <span
                key={shade}
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: shade }}
              />
            ))}
            <span className="text-[10px] font-medium text-black">많음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
