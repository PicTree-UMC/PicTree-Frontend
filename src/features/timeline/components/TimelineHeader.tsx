import type { PlanType } from "../types/timeline.types";

interface Props {
  totalCount: number;
  plan: PlanType;
  onUpgrade?: () => void;
}

export default function TimelineHeader({ totalCount, plan, onUpgrade }: Props) {
  return (
    <header className="bg-[#C5D89D] px-[31px] pb-5 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">타임라인</h1>
          <p className="mt-1 text-base font-medium text-black">
            총 {totalCount}개의 기록
          </p>
        </div>
        {plan === "free" && (
          <button
            type="button"
            onClick={onUpgrade}
            className="rounded-[12px] bg-[#5C6F2B] px-4 py-2 text-sm font-semibold text-white"
          >
            업그레이드
          </button>
        )}
      </div>
    </header>
  );
}
