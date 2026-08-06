import { useState } from 'react';
import type { BlogTreeRecord } from '../../types/blog';
import { BlogDateRangePicker } from '../BlogDateRangePicker';
import { BlogRoadmap } from '../BlogRoadmap';
import { CalendarIcon } from '../icons';

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' 표기 변환. */
const formatDot = (value: string) => value.split('-').join('.');

/** 시작·종료(포함) 기준 여행 일수를 사람이 읽는 라벨로. 당일이면 '당일'. */
function durationLabel(startDate: string, endDate: string) {
  const days =
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1;
  return days <= 1 ? '당일' : `${days - 1}박 ${days}일`;
}

type DateStepProps = {
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  selectedTreeIds: number[];
  onToggleTree: (treeId: number) => void;
  activityByDate: Record<string, number>;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onNext: () => void;
};

export function DateStep({ startDate, endDate, trees, selectedTreeIds, onToggleTree, activityByDate, onDateRangeChange, onNext }: DateStepProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <p className="text-[15px] leading-6 text-[#60655c]">블로그로 만들 여행 기간을 골라주세요.</p>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="여행 기간 선택"
        className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-pictree-100 bg-white px-5 py-[18px] text-left shadow-[0_6px_18px_rgba(45,51,34,0.06)] transition active:scale-[0.99]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pictree-100 text-pictree-700">
          <CalendarIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#60655c]">여행 기간</span>
            <span className="rounded-full bg-pictree-100 px-2 py-[1px] text-[13px] font-medium text-pictree-700">
              {durationLabel(startDate, endDate)}
            </span>
          </span>
          <span className="mt-1.5 flex items-center gap-2 text-[16px] font-medium text-[#2c3930]">
            {formatDot(startDate)}
            {startDate !== endDate && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5b6b38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                {formatDot(endDate)}
              </>
            )}
          </span>
        </span>
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="#c2c2c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
          <path d="m1.5 1.5 6 6-6 6" />
        </svg>
      </button>

      <div className="mt-5">
        <p className="text-[13px] font-medium text-[#2c3930]">
          이 기간의 기록 <span className="text-pictree-700">{selectedTreeIds.length}/{trees.length}개</span>
        </p>
        {trees.length === 0 ? (
          <p className="py-2 text-[13px] text-[#999]">선택한 기간에 저장된 기록이 없어요.</p>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-[#60655c]">초안에 넣을 기록을 탭해서 골라주세요.</p>
            <div className="mt-4">
              <BlogRoadmap trees={trees} selectedIds={selectedTreeIds} onToggle={onToggleTree} />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="mt-auto h-[54px] w-full rounded-xl bg-pictree-700 text-[16px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={selectedTreeIds.length === 0}
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
