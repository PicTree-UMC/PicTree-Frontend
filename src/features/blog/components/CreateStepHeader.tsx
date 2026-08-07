import { NavBar } from '@/shared/components';
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
    <header className="px-5 pb-3 pt-header">
      <NavBar onBack={onBack} title={STEP_LABELS[step]} />
      <div className="mt-4 flex gap-2" aria-hidden>
        {STEPS.map((value) => (
          <span
            key={value}
            className={`h-[5px] flex-1 rounded-full transition-colors ${value <= step ? 'bg-pictree-700' : 'bg-pictree-100'}`}
          />
        ))}
      </div>
    </header>
  );
}
