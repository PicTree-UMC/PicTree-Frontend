import { CalendarIcon, ChevronIcon } from './icons';
import type { BlogTreeRecord } from '../types/blog';

type DateRangeCardProps = {
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
};

export function DateRangeCard({ startDate, endDate, trees, onStartDateChange, onEndDateChange }: DateRangeCardProps) {
  const visibleTrees = trees.slice(0, 5);
  const hiddenCount = trees.length - visibleTrees.length;

  return (
    <div className="rounded-xl border-2 border-[#bed793] bg-white px-[18px] pb-3 pt-4">
      <h2 className="text-[16px] font-bold">날짜 범위 선택</h2>
      <div className="mt-1 grid grid-cols-2 gap-5">
        <DateField label="시작일" value={startDate} max={endDate} onChange={onStartDateChange} />
        <DateField label="종료일" value={endDate} min={startDate} onChange={onEndDateChange} />
      </div>
      <div className="mt-[10px] flex flex-wrap justify-center gap-[7px]">
        {visibleTrees.map((tree) => <span key={tree.treeId} className="min-w-[99px] rounded-[9px] bg-[#e9ffbb] px-3 py-[6px] text-center text-[10px] font-bold">{tree.name}</span>)}
        {hiddenCount > 0 && <span className="self-center text-[14px] font-medium">+{hiddenCount}개</span>}
        {trees.length === 0 && <p className="py-2 text-[12px] text-[#999]">선택한 기간에 저장된 나무가 없어요.</p>}
      </div>
    </div>
  );
}

function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (date: string) => void }) {
  return (
    <label className="relative text-[10px] text-[#a0a09c]">
      <span className="ml-2">{label}</span>
      <span className="pointer-events-none mt-1 flex h-[36px] items-center justify-between rounded-md bg-[#faf8ef] px-2 text-[14px] font-medium text-black"><CalendarIcon />{value.split('-').join('.')}<ChevronIcon /></span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        className="absolute inset-x-0 bottom-0 h-[36px] cursor-pointer opacity-0"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
