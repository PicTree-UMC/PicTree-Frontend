import type { ToneId } from '../../types/blog';
import { BLOG_TONES } from '../../constants/blogTones';
import { PrimaryCta } from '@/shared/components';

type ToneStepProps = {
  toneId: ToneId;
  onSelect: (toneId: ToneId) => void;
  onNext: () => void;
};

export function ToneStep({ toneId, onSelect, onNext }: ToneStepProps) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <p className="text-[15px] leading-6 text-ink-muted">기록한 기분을 바탕으로 어울리는 어체를 추천했어요. 원하는 문체로 바꿀 수 있어요.</p>

      <div className="mt-4 flex flex-col gap-3">
        {BLOG_TONES.map((tone) => {
          const selected = tone.id === toneId;
          return (
            <button
              key={tone.id}
              type="button"
              aria-pressed={selected}
              className={`flex w-full items-start gap-3 rounded-2xl border bg-white px-5 py-[18px] text-left transition active:scale-[0.99] ${
                selected
                  ? 'border-pictree-700 shadow-[0_6px_18px_rgba(45,51,34,0.10)]'
                  : 'border-pictree-100 shadow-[0_6px_18px_rgba(45,51,34,0.06)]'
              }`}
              onClick={() => onSelect(tone.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="text-[16px] font-medium">{tone.label}</span>
                <span className="mt-[2px] block text-[13px] text-ink-muted">{tone.description}</span>
                <span className="mt-2 block rounded-lg bg-[#f6f9ec] px-3 py-2 text-[13px] leading-5 text-ink-muted">"{tone.example}"</span>
              </span>
              <span
                className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition ${
                  selected
                    ? 'border-pictree-700 bg-pictree-700 text-white'
                    : 'border-line bg-white text-transparent'
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 13 4 4 10-11" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      <PrimaryCta className="mt-6" onClick={onNext}>
        이 어체로 작성하기
      </PrimaryCta>
    </div>
  );
}
