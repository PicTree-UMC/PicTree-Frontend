import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarGrid } from '../../../shared/components';

type BlogDateRangePickerProps = {
  startDate: string;
  endDate: string;
  activityByDate: Record<string, number>;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
};

export function BlogDateRangePicker({ startDate, endDate, activityByDate, onClose, onApply }: BlogDateRangePickerProps) {
  const initialDate = new Date(`${startDate}T00:00:00`);
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);
  const [selectingStart, setSelectingStart] = useState(true);

  const moveMonth = (amount: number) => {
    const next = new Date(year, month - 1 + amount, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const selectDate = (date: string) => {
    if (selectingStart) {
      setRangeStart(date);
      setRangeEnd('');
      setSelectingStart(false);
      return;
    }

    if (date < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
    } else {
      setRangeEnd(date);
    }
    setSelectingStart(true);
  };

  return createPortal(
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full -translate-x-1/2 items-center justify-center bg-black/50 px-5 sm:max-w-[390px]" role="presentation" onClick={onClose}>
      <section className="w-full rounded-[20px] bg-[#fffcef] p-5" role="dialog" aria-modal="true" aria-labelledby="blog-calendar-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달" className="p-2 text-2xl">‹</button>
          <h2 id="blog-calendar-title" className="text-[18px] font-medium">{year}년 {month}월</h2>
          <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달" className="p-2 text-2xl">›</button>
        </div>
        <p className="mb-3 text-center text-[11px] text-[#777]">{selectingStart ? '시작일을 선택해주세요' : '종료일을 선택해주세요'}</p>
        <CalendarGrid year={year} month={month} activityByDate={activityByDate} startDate={rangeStart} endDate={rangeEnd} onDateSelect={selectDate} />
        <div className="mt-4 flex gap-3">
          <button type="button" className="h-11 flex-1 rounded-xl bg-[#e4e5e6] font-medium text-[#60655c]" onClick={onClose}>취소</button>
          <button type="button" className="h-11 flex-1 rounded-xl bg-[#788f4a] font-medium text-white disabled:opacity-40" disabled={!rangeStart || !rangeEnd} onClick={() => onApply(rangeStart, rangeEnd)}>적용</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
