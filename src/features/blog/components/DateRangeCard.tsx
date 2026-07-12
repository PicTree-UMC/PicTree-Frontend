import { CalendarIcon, ChevronIcon } from './icons';

const ITINERARY = ['포그레인 공원', '피자 맛집', '마트', '산책', '아침밥 구매'];

export function DateRangeCard() {
  return (
    <div className="rounded-xl border-2 border-[#bed793] bg-white px-[18px] pb-3 pt-4">
      <h2 className="text-[16px] font-bold">날짜 범위 선택</h2>
      <div className="mt-1 grid grid-cols-2 gap-5">
        <DateField label="시작일" value="2026.03.31" />
        <DateField label="종료일" value="2026.04.01" />
      </div>
      <div className="mt-[10px] flex flex-wrap justify-center gap-[7px]">
        {ITINERARY.map((item) => <span key={item} className="min-w-[99px] rounded-[9px] bg-[#ffecae] px-3 py-[6px] text-center text-[10px] font-bold">{item}</span>)}
        <span className="self-center text-[14px] font-medium">+1개</span>
      </div>
    </div>
  );
}

function DateField({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-[10px] text-[#a0a09c]">
      <span className="ml-2">{label}</span>
      <span className="mt-1 flex h-[36px] items-center justify-between rounded-md bg-[#faf8ef] px-2 text-[14px] font-medium text-black"><CalendarIcon />{value}<ChevronIcon /></span>
    </label>
  );
}
