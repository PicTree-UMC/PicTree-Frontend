import { useState } from 'react';
import type { BlogSection, BlogStatus } from '../../types/blog';
import { GeneratingCard } from '../GeneratingCard';
import { useToast } from '../../../../shared/components/toast/toastStore';

type ResultStepProps = {
  status: BlogStatus;
  draft: { title: string; sections: BlogSection[] } | null;
  onSave: () => Promise<void>;
};

export function ResultStep({ status, draft, onSave }: ResultStepProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="blog-result-enter flex flex-1 flex-col pb-6 pt-2">
      <article className="mx-5 overflow-hidden rounded-2xl border border-[#e7e8dc] bg-white shadow-[0_5px_18px_rgba(45,51,34,0.06)]">
        <header className="px-5 pb-5 pt-6">
          <span className="text-[12px] font-medium text-[#7b8f4d]">여행 기록</span>
          <h2 className="mt-2 text-[23px] font-bold leading-[1.4] tracking-[-0.02em] text-[#20251f]">
            {draft.title}
          </h2>
          <p className="mt-3 text-[12px] text-[#9a9e96]">AI가 여행 기록과 사진으로 작성한 초안이에요.</p>
        </header>

        <div className="h-px bg-[#f0f0e9]" />

        <div className="px-5 pb-8 pt-6">
          {draft.sections.map((section, i) => (
            <section key={`${section.treeId}-${i}`} className={i > 0 ? 'mt-10' : undefined}>
              <h3 className="text-[19px] font-bold leading-snug text-[#252b24]">
                {i + 1}. {section.heading}
              </h3>
              {section.image && (
                <figure className="mt-4 overflow-hidden rounded-lg bg-[#ecf6d8]">
                  <img
                    src={section.image}
                    alt={`${section.heading}에서 촬영한 사진`}
                    className="max-h-[440px] w-full object-cover"
                  />
                </figure>
              )}
              <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.9] text-[#444a43]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>

      <div className="mt-auto flex gap-3 px-5 pt-5">
        <button type="button" className="h-[54px] flex-1 rounded-xl bg-[#e4e5e6] text-[15px] font-medium text-[#60655c]" onClick={handleCopy}>복사하기</button>
        <button
          type="button"
          className="h-[54px] flex-[2] rounded-xl bg-[#5b6b38] text-[15px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
