import { NavBar } from '@/shared/components';
import type { CreateStep } from '../hooks/useBlogCreate';

// 1단계는 기간이 아니라 **저장한 동선**을 고른다(이슈 #212) — 기간은 그 동선에서 파생된다.
const STEP_LABELS: Record<CreateStep, string> = {
  1: '동선 선택',
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
