import { useEffect, useState } from 'react';

const GENERATING_STEPS = [
  '여행 기록을 모으고 있어요',
  '사진과 방문 순서를 정리하고 있어요',
  '블로그 문장을 다듬고 있어요',
];

export function GeneratingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % GENERATING_STEPS.length);
    }, 1600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mt-5" role="status" aria-live="polite">
      <div className="mb-4 flex items-center gap-3 px-1">
        <span className="blog-ai-pulse grid size-10 shrink-0 place-items-center rounded-full bg-[#ecf6d8] text-[20px] text-[#6f8542]" aria-hidden>
          ✦
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#2c3930]">AI가 여행 글을 쓰고 있어요</p>
          <p key={step} className="blog-step-enter mt-1 text-[13px] text-[#737970]">
            {GENERATING_STEPS[step]}
          </p>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-[#e7e8dc] bg-white shadow-[0_5px_18px_rgba(45,51,34,0.06)]" aria-hidden>
        <header className="px-5 pb-5 pt-6">
          <div className="blog-skeleton h-3 w-16 rounded-full" />
          <div className="blog-skeleton mt-4 h-6 w-[84%] rounded-md" />
          <div className="blog-skeleton mt-2 h-6 w-[58%] rounded-md" />
          <div className="blog-skeleton mt-4 h-3 w-36 rounded-full" />
        </header>
        <div className="h-px bg-[#f0f0e9]" />
        <div className="px-5 pb-8 pt-6">
          <div className="blog-skeleton h-5 w-32 rounded-md" />
          <div className="blog-skeleton mt-4 aspect-[16/10] w-full rounded-lg" />
          <div className="mt-5 space-y-2.5">
            <div className="blog-skeleton h-3.5 w-full rounded-full" />
            <div className="blog-skeleton h-3.5 w-[94%] rounded-full" />
            <div className="blog-skeleton h-3.5 w-[76%] rounded-full" />
          </div>
        </div>
      </article>
    </div>
  );
}
