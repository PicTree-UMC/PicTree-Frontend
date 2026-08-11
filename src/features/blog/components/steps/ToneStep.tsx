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
              className={`rounded-xl border-2 bg-white px-[18px] py-4 text-left transition active:scale-[0.99] ${selected ? 'border-pictree-700' : 'border-pictree-100'}`}
              onClick={() => onSelect(tone.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium">{tone.label}</span>
                {/*
                  체크 자리는 **고르든 말든 항상 비워 둔다.** 조건부로 그리면 고를 때마다 줄
                  높이가 아이콘만큼 뛰어 아래 카드가 통째로 밀리는데, 어체를 연달아 바꿔 보는
                  화면이라 다음 목표가 손가락 밑에서 움직인다.

                  ⚠️ 크기는 `scale-[0.55]` 로 줄이지 않는다 — transform 은 그려지는 크기만
                  줄이고 레이아웃 박스는 34px 그대로라, 자리를 예약해도 점프가 남는다.
                  아이콘에 직접 19px 을 준다(=34×0.55, 획 두께도 2.34px→2.38px 로 같다).
                */}
                <span className="grid size-[19px] shrink-0 place-items-center">
                  {selected && <CheckIcon size={19} />}
                </span>
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
