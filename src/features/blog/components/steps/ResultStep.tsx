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

  const goTo = (next: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(next, slideCount - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setIndex(clamped);
  };

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
            <span className="pointer-events-none absolute -right-6 -top-6 text-[96px] leading-none text-white/10" aria-hidden>✦</span>
            <p className="text-[13px] font-bold tracking-[0.14em] text-white/80">AI 여행기록</p>
            <h2 className="mt-2 text-[22px] font-bold leading-snug">{draft.title}</h2>
            <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[13px] font-medium">
              <span aria-hidden>📍</span>
              {total}개의 장소를 담았어요
            </p>
            <p className="mt-6 text-[13px] text-white/70">넘겨서 장소별 기록을 확인해 보세요 →</p>
          </section>
        </div>

        {/* 장소별 슬라이드 */}
        {draft.sections.map((section, i) => (
          <div key={section.treeId} className="w-full shrink-0 snap-center px-5">
            <article className="flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border-2 border-[#bed793] bg-white shadow-[0_6px_16px_rgba(45,51,34,0.08)]">
              <div className="relative h-[60%] w-full shrink-0">
                <img src={section.image} alt={`${section.heading}에서 촬영한 사진`} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-black/45 px-2 text-[13px] font-bold text-white backdrop-blur-sm">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.mood && (
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[18px] shadow-sm backdrop-blur-sm" aria-hidden>
                    {section.mood}
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col px-[22px] py-4">
                <h3 className="text-[15px] font-bold text-[#20251f]">{section.heading}</h3>
                <p className="mt-2 overflow-hidden text-[15px] leading-6 text-[#555] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5]">{section.body}</p>
              </div>
            </article>
          </div>
        ))}
      </div>

      {/* 캐러셀 네비게이션 */}
      <div className="mt-4 flex items-center justify-center gap-5 px-5">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full border border-[#d5ddc4] bg-white text-[#5c6f2b] transition disabled:opacity-35"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="이전 카드"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7.5 1 1.5 7.5l6 6.5" /></svg>
        </button>

        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: slideCount }).map((_, dot) => (
            <span
              key={dot}
              className={`h-[6px] rounded-full transition-all ${dot === index ? 'w-4 bg-[#7f9648]' : 'w-[6px] bg-[#d5ddc4]'}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full border border-[#d5ddc4] bg-white text-[#5c6f2b] transition disabled:opacity-35"
          onClick={() => goTo(index + 1)}
          disabled={index === slideCount - 1}
          aria-label="다음 카드"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1.5 1 7.5 7.5l-6 6.5" /></svg>
        </button>
      </div>

      <div className="mt-5 flex gap-3 px-5">
        <button type="button" className="h-[54px] flex-1 rounded-xl bg-[#e4e5e6] text-[15px] font-bold text-[#60655c]" onClick={handleCopy}>복사하기</button>
        <button type="button" className="h-[54px] flex-[2] rounded-xl bg-[#7f9648] text-[15px] font-bold text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]" onClick={onSave}>저장하기</button>
      </div>
    </div>
  );
}
