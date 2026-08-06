import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarGrid, CalendarMonthNav } from '../../../shared/components';
import { useMonthCursor } from '../../../shared/hooks/useMonthCursor';

type BlogDateRangePickerProps = {
  startDate: string;
  endDate: string;
  activityByDate: Record<string, number>;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
};

export function BlogDateRangePicker({ startDate, endDate, activityByDate, onClose, onApply }: BlogDateRangePickerProps) {
  const initialDate = new Date(`${startDate}T00:00:00`);
  const cursor = useMonthCursor({
    initial: { year: initialDate.getFullYear(), month: initialDate.getMonth() + 1 },
  });
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);
  const [selectingStart, setSelectingStart] = useState(true);

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
        <h2 id="blog-calendar-title" className="sr-only">여행 기간 선택</h2>
        <CalendarMonthNav year={cursor.year} month={cursor.month} onPrev={cursor.goPrev} onNext={cursor.goNext} />
        <p className="mb-3 text-center text-[13px] text-[#60655c]">{selectingStart ? '시작일을 선택해주세요' : '종료일을 선택해주세요'}</p>
        <CalendarGrid year={cursor.year} month={cursor.month} activityByDate={activityByDate} rangeStart={rangeStart} rangeEnd={rangeEnd} onDateSelect={selectDate} />
        <div className="mt-4 flex gap-3">
          <button type="button" className="h-11 flex-1 rounded-xl bg-[#e4e5e6] font-medium text-[#60655c]" onClick={onClose}>취소</button>
          {/* 흰 글자를 얹으므로 GREEN-700. 500(#788f4a)은 흰 글자와 3.5:1 이라 못 쓴다(#147). */}
          <button type="button" className="h-11 flex-1 rounded-xl bg-pictree-700 font-medium text-white disabled:opacity-40" disabled={!rangeStart || !rangeEnd} onClick={() => onApply(rangeStart, rangeEnd)}>적용</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
