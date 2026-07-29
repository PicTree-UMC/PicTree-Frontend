import { useRef, useState } from 'react';
import type { BlogSection, BlogStatus } from '../../types/blog';
import { GeneratingCard } from '../GeneratingCard';
import { useToast } from '../../../../shared/components/toast/toastStore';

type ResultStepProps = {
  status: BlogStatus;
  draft: { title: string; sections: BlogSection[] } | null;
  onSave: () => void;
};

export function ResultStep({ status, draft, onSave }: ResultStepProps) {
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (status !== 'ready' || !draft) {
    return (
      <div className="px-5 pt-2">
        <GeneratingCard />
      </div>
    );
  }

  const handleCopy = async () => {
    const text = [draft.title, '', ...draft.sections.map((section, i) => `${i + 1}. ${section.heading}\n${section.body}`)].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('초안을 복사했어요', 'success');
    } catch {
      showToast('복사에 실패했어요', 'error');
    }
  };

  const total = draft.sections.length;
  const slideCount = total + 1; // 표지 + 장소 카드

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="flex flex-1 flex-col pb-6 pt-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 표지 슬라이드 */}
        <div className="w-full shrink-0 snap-center px-5">
          <section className="relative flex aspect-[4/5] flex-col justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#7f9648,#9db85f)] px-6 text-white shadow-[0_10px_24px_rgba(45,51,34,0.18)]">
            <h2 className="text-center text-[22px] font-medium leading-snug">{draft.title}</h2>
            <p className="absolute bottom-5 right-6 text-[13px] text-white/70">넘겨서 장소별 기록을 확인해 보세요 →</p>
          </section>
        </div>

        {/* 장소별 슬라이드 */}
        {draft.sections.map((section, i) => (
          <div key={section.treeId} className="w-full shrink-0 snap-center px-5">
            <article className="flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border-2 border-[#bed793] bg-white shadow-[0_6px_16px_rgba(45,51,34,0.08)]">
              <div className="relative h-[60%] w-full shrink-0">
                <img src={section.image} alt={`${section.heading}에서 촬영한 사진`} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-black/45 px-2 text-[13px] font-medium text-white backdrop-blur-sm">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.mood && (
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[18px] shadow-sm backdrop-blur-sm" aria-hidden>
                    {section.mood}
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col px-[22px] py-4">
                <h3 className="text-[15px] font-medium text-[#20251f]">{section.heading}</h3>
                <p className="mt-2 overflow-hidden text-[15px] leading-6 text-[#555] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5]">{section.body}</p>
              </div>
            </article>
          </div>
        ))}
      </div>

      {/* 캐러셀 인디케이터: 스와이프로 이동, 점으로 현재 위치 표시 */}
      <div className="mt-4 flex items-center justify-center gap-1.5 px-5" aria-hidden>
        {Array.from({ length: slideCount }).map((_, dot) => (
          <span
            key={dot}
            className={`h-[6px] rounded-full transition-all ${dot === index ? 'w-4 bg-[#7f9648]' : 'w-[6px] bg-[#d5ddc4]'}`}
          />
        ))}
      </div>

      <div className="mt-auto flex gap-3 px-5 pt-5">
        <button type="button" className="h-[54px] flex-1 rounded-xl bg-[#e4e5e6] text-[15px] font-medium text-[#60655c]" onClick={handleCopy}>복사하기</button>
        <button type="button" className="h-[54px] flex-[2] rounded-xl bg-[#7f9648] text-[15px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]" onClick={onSave}>저장하기</button>
      </div>
    </div>
  );
}
