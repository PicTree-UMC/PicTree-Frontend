import { useState } from 'react';
import type { BlogDay, BlogStatus } from '../../types/blog';
import { GeneratingCard } from '../GeneratingCard';
import { useToast } from '../../../../shared/components/toast/toastStore';
import { formatLongDate } from '../../lib/formatBlogDate';

type ResultStepProps = {
  status: BlogStatus;
  draft: { title: string; days: BlogDay[] } | null;
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
    const text = [
      draft.title,
      '',
      ...draft.days.map((day) => [
        formatLongDate(day.date),
        ...day.sections.map((section) => `${section.heading}\n${section.body}`),
      ].join('\n\n')),
    ].join('\n\n');
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

        <div className="px-5 pb-8 pt-2">
          {draft.days.map((day, dayIndex) => (
            <section key={day.date} className={dayIndex > 0 ? 'mt-14 border-t border-[#eeeeea] pt-10' : 'pt-6'}>
              <h3 className="text-center text-[18px] font-bold tracking-[-0.01em] text-[#30362f]">
                {formatLongDate(day.date)}
              </h3>
              <div className="mt-7">
                {day.sections.map((section, sectionIndex) => (
                  <article key={`${section.treeId}-${sectionIndex}`} className={sectionIndex > 0 ? 'mt-10' : undefined}>
                    {section.image && (
                      <figure className="overflow-hidden rounded-lg bg-pictree-100">
                        <img
                          src={section.image}
                          alt={`${section.heading}에서 촬영한 사진`}
                          className="max-h-[440px] w-full object-cover"
                        />
                      </figure>
                    )}
                    <h4 className={`${section.image ? 'mt-5' : ''} text-[18px] font-bold leading-snug text-[#252b24]`}>
                      {section.heading}
                    </h4>
                    <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.9] text-[#444a43]">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <div className="mt-auto flex gap-3 px-5 pt-5">
        <button type="button" className="h-[54px] flex-1 rounded-xl bg-[#e4e5e6] text-[15px] font-medium text-[#60655c]" onClick={handleCopy}>복사하기</button>
        <button
          type="button"
          className="h-[54px] flex-[2] rounded-xl bg-pictree-700 text-[15px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
