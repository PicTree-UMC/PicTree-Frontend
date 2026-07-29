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
      <p className="text-[14px] leading-6 text-[#6d7466]">기록한 기분을 바탕으로 어울리는 어체를 추천했어요. 원하는 문체로 바꿀 수 있어요.</p>

      <div className="mt-4 flex flex-col gap-3">
        {BLOG_TONES.map((tone) => {
          const selected = tone.id === toneId;
          return (
            <button
              key={tone.id}
              type="button"
              aria-pressed={selected}
              className={`rounded-xl border-2 bg-white px-[18px] py-4 text-left transition-colors ${selected ? 'border-[#7f9648]' : 'border-[#e6ecd5]'}`}
              onClick={() => onSelect(tone.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold">{tone.label}</span>
                {selected && <span className="scale-[0.55] text-[#7f9648]"><CheckIcon /></span>}
              </div>
              <p className="mt-[2px] text-[12px] text-[#8a927e]">{tone.description}</p>
              <p className="mt-2 rounded-lg bg-[#f6f9ec] px-3 py-2 text-[12px] leading-5 text-[#4b5340]">"{tone.example}"</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-6 h-[54px] w-full rounded-xl bg-[#7f9648] text-[16px] font-bold text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]"
        onClick={onNext}
      >
        이 어체로 작성하기
      </button>
    </div>
  );
}
