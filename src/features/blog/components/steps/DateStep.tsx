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
    <div className="flex flex-1 flex-col px-5 pt-2">
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

      {/*
        `다음` 을 화면 바닥에 붙여 둔다.

        예전엔 `mt-auto` 뿐이라 **콘텐츠가 짧을 때만** 바닥에 붙었다. 기간에 기록이
        많으면 로드맵 길이만큼 아래로 밀려, 다음으로 가려면 매번 끝까지 내려야 했다.
        `mt-auto` 는 그대로 둬야 기록이 적을 때 버튼이 본문 바로 밑에 뜨지 않는다.

        스크롤은 앱 셸(`AppShell`)이 갖고 이 화면엔 탭바가 없어서, 비켜 갈 것은
        하단 안전영역뿐이다. `-mx-5 px-5` 로 바탕을 화면 폭까지 늘려 밑으로 지나가는
        내용이 비치지 않게 하고, 위쪽엔 짧은 그라데이션을 둬 잘린 티가 덜 나게 한다.
      */}
      <div className="sticky bottom-0 -mx-5 mt-auto bg-[#fffcef] px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-5 bg-gradient-to-t from-[#fffcef] to-transparent"
        />
        <button
          type="button"
          className="h-[54px] w-full rounded-xl bg-pictree-700 text-[16px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onNext}
          disabled={selectedTreeIds.length === 0}
        >
          다음
        </button>
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
    </div>
  );
}
