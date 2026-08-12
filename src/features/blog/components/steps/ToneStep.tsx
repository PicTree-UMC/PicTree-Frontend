import type { ToneId } from '../../types/blog';
import { BLOG_TONES } from '../../constants/blogTones';
import { PrimaryCta } from '@/shared/components';
import { StepFooter } from '../StepFooter';

type ToneStepProps = {
  toneId: ToneId;
  onSelect: (toneId: ToneId) => void;
  onNext: () => void;
};

/**
 * ②단계 — 어체 고르기.
 *
 * ⚠️ **CTA 는 스크롤 영역 밖(`StepFooter`)에 있다.** 종전에는 카드 목록 끝에 `mt-6` 으로
 * 달려 있었는데, 카드 세 장이 약 700px 이라 이 화면이 딱 갈리는 자리였다 — iPhone
 * (가시영역 ~715px)에서는 들어가고 갤럭시(~650px)에서는 버튼이 화면 밖으로 밀려나
 * 못 눌렸다. 경위는 `StepFooter` 주석에 있다.
 */
export function ToneStep({ toneId, onSelect, onNext }: ToneStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 카드 목록만 스크롤한다. `min-h-0` 이 없으면 내용 높이만큼 버텨서 안 걸린다. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <p className="text-[15px] leading-6 text-ink-muted">기록한 기분을 바탕으로 어울리는 어체를 추천했어요. 원하는 문체로 바꿀 수 있어요.</p>

        <div className="mt-4 flex flex-col gap-3">
          {BLOG_TONES.map((tone) => {
            const selected = tone.id === toneId;

            /*
              카드의 `active:scale-[0.99]` 는 눌린 티를 내려는 것이다 — 안드로이드 크로미움은
              스크롤 판정이 끝날 때까지 기본 탭 하이라이트와 `:active` 를 미뤄서, 표시가 하나도
              없으면 손을 뗄 때까지 아무 반응이 없다(갤럭시 제보). 특히 이 화면은 진입 시 추천
              어체가 이미 켜져 있어(useBlogCreate 의 suggestToneFromMoods) 그걸 다시 누르면
              화면이 문자 그대로 안 바뀐다.

              1단계 카드(RouteStep)와 같은 값이고, `transition-colors` 로는 스케일이 안 물어서
              `transition` 으로 넓혔다.
            */
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
      </div>

      <StepFooter>
        <PrimaryCta onClick={onNext}>이 어체로 작성하기</PrimaryCta>
      </StepFooter>
    </div>
  );
}
