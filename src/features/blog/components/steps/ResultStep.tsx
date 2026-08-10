import { useState } from 'react';
import type { BlogDraftPreview, BlogStatus } from '../../types/blog';
import { GeneratingCard } from '../GeneratingCard';
import { useToast } from '../../../../shared/components/toast/toastStore';
import { Photo } from '@/shared/components';
import { formatLongDate } from '../../lib/formatBlogDate';

type ResultStepProps = {
  status: BlogStatus;
  /** 실패 사유(서버 문구). `status === 'error'` 일 때만 쓴다. */
  errorMessage: string | null;
  draft: BlogDraftPreview | null;
  onSave: () => Promise<void>;
  /** 같은 조건으로 초안 생성을 다시 건다. */
  onRetry: () => void;
  /** 어체 선택(2단계)으로 돌아간다. 조건을 바꿔 보려는 사람의 길이다. */
  onBack: () => void;
};

export function ResultStep({
  status,
  errorMessage,
  draft,
  onSave,
  onRetry,
  onBack,
}: ResultStepProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  /*
    실패를 먼저 가른다. 아래 스켈레톤 분기가 `ready` 가 아닌 것을 전부 삼키고 있어서,
    실패해도 "AI가 여행 글을 쓰고 있어요" 가 영원히 돌았다 — 이 이슈(#210)의 증상이다.
  */
  if (status === 'error') {
    return (
      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-[#e7e8dc] bg-white px-5 py-7 text-center shadow-[0_5px_18px_rgba(45,51,34,0.06)]"
        >
          <span
            aria-hidden
            className="mx-auto grid size-10 place-items-center rounded-full bg-[#fdeaea] text-[#dc2626]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 8v5M12 16.5v.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>

          <p className="mt-4 text-[15px] font-medium text-[#2c3930]">초안을 만들지 못했어요</p>

          {/* 서버 문구를 그대로 보인다 — 다음부터는 콘솔을 열지 않아도 원인이 보인다. */}
          {errorMessage && (
            <p className="mt-2 text-[13px] leading-[1.7] text-[#60655c]">{errorMessage}</p>
          )}
        </div>

        {/* 비율은 아래 `복사하기 / 저장하기` 줄과 같게 둔다 — 같은 자리의 같은 문법이다. */}
        <div className="mt-auto flex gap-3 pt-5">
          <button
            type="button"
            onClick={onBack}
            className="h-[54px] flex-1 rounded-xl bg-line-soft text-[15px] font-medium text-[#60655c]"
          >
            이전 단계로
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="h-[54px] flex-[2] rounded-xl bg-pictree-700 text-[15px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

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
          <span className="text-[12px] font-medium text-pictree-700">여행 기록</span>
          <h2 className="mt-2 text-[23px] font-bold leading-[1.4] tracking-[-0.02em] text-[#2c3930]">
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
                    {/*
                      못 불러온 사진은 아무것도 안 그린다(`fallback={null}`) — 글에는
                      아이콘보다 없는 편이 낫다. `figure` 는 높이 0 이 되지만 아래 `mt-5`
                      는 남아 20px 빈틈이 생기는데, 그건 그대로 둔다: 실패 여부를 바깥
                      JSX 로 끌어올리지 않으려고 받아들인 값이다(#214).
                    */}
                    {section.image && (
                      <figure className="overflow-hidden rounded-lg bg-pictree-100">
                        <Photo
                          src={section.image}
                          alt={`${section.heading}에서 촬영한 사진`}
                          className="max-h-[440px] w-full object-cover"
                          fallback={null}
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
        <button type="button" className="h-[54px] flex-1 rounded-xl bg-line-soft text-[15px] font-medium text-[#60655c]" onClick={handleCopy}>복사하기</button>
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
