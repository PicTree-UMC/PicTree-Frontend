import type { ToneId } from '../../types/blog';
import { BLOG_TONES } from '../../constants/blogTones';
import { CheckIcon } from '../icons';

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
              className={`rounded-xl border-2 bg-white px-[18px] py-4 text-left transition-colors ${selected ? 'border-pictree-700' : 'border-pictree-100'}`}
              onClick={() => onSelect(tone.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium">{tone.label}</span>
                {selected && <span className="scale-[0.55] text-pictree-700"><CheckIcon /></span>}
              </div>
              <p className="mt-[2px] text-[13px] text-ink-muted">{tone.description}</p>
              <p className="mt-2 rounded-lg bg-[#f6f9ec] px-3 py-2 text-[13px] leading-5 text-ink-muted">"{tone.example}"</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-6 h-[54px] w-full rounded-xl bg-pictree-700 text-[16px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]"
        onClick={onNext}
      >
        이 어체로 작성하기
      </button>
    </div>
  );
}
