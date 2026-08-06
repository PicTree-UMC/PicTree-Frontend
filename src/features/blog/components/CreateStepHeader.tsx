import { BackButton } from '@/shared/components';
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
  // 상단 여백 = 노치(safe-area) + 0.75rem. 고정 px(pt-[56px])는 safe-area 가 작은
  // 기기에서 과하게 떠 보였다. BlogPage·AuthShell·CameraPage 와 같은 값으로 통일.
  return (
    <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-[19px] font-medium leading-6">{STEP_LABELS[step]}</h1>
      </div>
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
