import { useState } from 'react';
import type { BlogTreeRecord } from '../types/blog';
import { BlogDateRangePicker } from './BlogDateRangePicker';
import { CalendarIcon, ChevronIcon } from './icons';

type DateRangeCardProps = {
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  activityByDate: Record<string, number>;
  onDateRangeChange: (startDate: string, endDate: string) => void;
};

export function DateRangeCard({ startDate, endDate, trees, activityByDate, onDateRangeChange }: DateRangeCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const visibleTrees = trees.slice(0, 5);
  const hiddenCount = trees.length - visibleTrees.length;

  return (
    <>
      <div className="rounded-xl border-2 border-[#bed793] bg-white px-[18px] pb-3 pt-4">
        <h2 className="text-[16px] font-bold">날짜 범위 선택</h2>
        <div className="mt-1 grid grid-cols-2 gap-5">
          <DateField label="시작일" value={startDate} onClick={() => setPickerOpen(true)} />
          <DateField label="종료일" value={endDate} onClick={() => setPickerOpen(true)} />
        </div>
        <div className="mt-[10px] flex flex-wrap justify-center gap-[7px]">
          {visibleTrees.map((tree) => <span key={tree.treeId} className="min-w-[99px] rounded-[9px] bg-[#e9ffbb] px-3 py-[6px] text-center text-[10px] font-bold">{tree.name}</span>)}
          {hiddenCount > 0 && <span className="self-center text-[14px] font-medium">+{hiddenCount}개</span>}
          {trees.length === 0 && <p className="py-2 text-[12px] text-[#999]">선택한 기간에 저장된 나무가 없어요.</p>}
        </div>
      </div>
      {pickerOpen && (
        <BlogDateRangePicker
          startDate={startDate}
          endDate={endDate}
          activityByDate={activityByDate}
          onClose={() => setPickerOpen(false)}
          onApply={(start, end) => {
            onDateRangeChange(start, end);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

function DateField({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <div className="text-[10px] text-[#a0a09c]">
      <span className="ml-2">{label}</span>
      <button type="button" aria-label={`${label} 선택`} className="mt-1 flex h-[36px] w-full items-center justify-between rounded-md bg-[#faf8ef] px-2 text-[14px] font-medium text-black" onClick={onClick}>
        <CalendarIcon />{value.split('-').join('.')}<ChevronIcon />
      </button>
    </div>
  );
}
