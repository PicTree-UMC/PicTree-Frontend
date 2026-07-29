import type { CreateStep } from '../hooks/useBlogCreate';

const STEP_LABELS: Record<CreateStep, string> = {
  1: '날짜 선택',
  2: '어체 선택',
  3: '결과 확인',
};

const STEPS: CreateStep[] = [1, 2, 3];

type CreateStepHeaderProps = {
  step: CreateStep;
  onBack: () => void;
};

export function CreateStepHeader({ step, onBack }: CreateStepHeaderProps) {
  return (
    <header className="px-5 pb-3 pt-[56px]">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="뒤로" className="-ml-2 grid h-9 w-9 place-items-center text-[#20251f]" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div>
          <p className="text-[12px] font-medium text-[#8a927e]">{step} / 3</p>
          <h1 className="text-[19px] font-bold leading-6">{STEP_LABELS[step]}</h1>
        </div>
      </div>
      <div className="mt-4 flex gap-2" aria-hidden>
        {STEPS.map((value) => (
          <span
            key={value}
            className={`h-[5px] flex-1 rounded-full transition-colors ${value <= step ? 'bg-[#7f9648]' : 'bg-[#e6ecd5]'}`}
          />
        ))}
      </div>
    </header>
  );
}
