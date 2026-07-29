import { useState } from 'react';
import type { BlogTreeRecord } from '../../types/blog';
import { BlogDateRangePicker } from '../BlogDateRangePicker';
import { CalendarIcon, ChevronIcon } from '../icons';

type DateStepProps = {
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  activityByDate: Record<string, number>;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onNext: () => void;
};

export function DateStep({ startDate, endDate, trees, activityByDate, onDateRangeChange, onNext }: DateStepProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <p className="text-[14px] leading-6 text-[#6d7466]">블로그로 만들 여행 기간을 골라주세요.</p>

      <div className="mt-4 rounded-xl border-2 border-[#bed793] bg-white px-[18px] pb-4 pt-4">
        <div className="grid grid-cols-2 gap-5">
          <DateField label="시작일" value={startDate} onClick={() => setPickerOpen(true)} />
          <DateField label="종료일" value={endDate} onClick={() => setPickerOpen(true)} />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[13px] font-bold text-[#20251f]">이 기간의 기록 <span className="text-[#7f9648]">{trees.length}개</span></p>
        <div className="mt-2 flex flex-wrap gap-[7px]">
          {trees.map((tree) => (
            <span key={tree.treeId} className="flex items-center gap-1 rounded-[9px] bg-[#e9ffbb] px-3 py-[6px] text-[11px] font-bold">
              <span aria-hidden>{tree.mood}</span>{tree.name}
            </span>
          ))}
          {trees.length === 0 && <p className="py-2 text-[12px] text-[#999]">선택한 기간에 저장된 기록이 없어요.</p>}
        </div>
      </div>

      <button
        type="button"
        className="mt-auto h-[54px] w-full rounded-xl bg-[#7f9648] text-[16px] font-bold text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={trees.length === 0}
      >
        다음
      </button>

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
    </div>
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
