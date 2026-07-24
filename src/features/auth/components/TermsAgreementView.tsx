import { useMemo, useState } from 'react';

import { Button } from '../../../shared/components';
import { AGREEMENT_TERMS } from '../constants/terms';
import type { TermId } from '../types/auth';

type TermsAgreementViewProps = {
  onAgree: () => void;
};

export function TermsAgreementView({ onAgree }: TermsAgreementViewProps) {
  const [checkedTerms, setCheckedTerms] = useState<Set<TermId>>(new Set());
  const [expandedTerms, setExpandedTerms] = useState<Set<TermId>>(new Set());

  const requiredTermIds = useMemo(
    () => AGREEMENT_TERMS.filter((term) => term.required).map((term) => term.id),
    [],
  );
  const isAllChecked = checkedTerms.size === AGREEMENT_TERMS.length;
  const canStart = requiredTermIds.every((id) => checkedTerms.has(id));

  const toggleAll = () => {
    setCheckedTerms(isAllChecked ? new Set() : new Set(AGREEMENT_TERMS.map((term) => term.id)));
  };

  const toggleTerm = (termId: TermId) => {
    setCheckedTerms((prev) => {
      const next = new Set(prev);

      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }

      return next;
    });
  };

  const toggleExpanded = (termId: TermId) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);

      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }

      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="px-2 font-['KOROAD'] text-[1.5rem] font-bold leading-normal text-[#2C3930]">
        서비스 이용 동의
      </h1>

      <Button
        unstyled
        className="mt-6 flex h-[3.75rem] w-full items-center gap-4 rounded-[1.125rem] bg-[#E1EBC4] px-6 font-['KOROAD'] text-[1.125rem] font-bold text-[#111]"
        type="button"
        onClick={toggleAll}
      >
        <CheckCircle checked={isAllChecked} />
        약관 전체 동의하기
      </Button>

      <section className="mt-4 rounded-[1.125rem] bg-[#FFFDF7] px-6 py-5">
        <h2 className="mb-5 font-['KOROAD'] text-[1.125rem] font-bold text-[#111]">약관 안내</h2>
        <div className="space-y-4">
          {AGREEMENT_TERMS.map((term) => {
            const checked = checkedTerms.has(term.id);
            const expanded = expandedTerms.has(term.id);

            return (
              <article key={term.id} className="grid grid-cols-[1.75rem_1fr_1.5rem] gap-3">
                <Button
                  unstyled
                  aria-label={`${term.title} ${checked ? '동의 취소' : '동의'}`}
                  className="mt-0.5 h-6 w-6"
                  type="button"
                  onClick={() => toggleTerm(term.id)}
                >
                  <CheckCircle checked={checked} compact />
                </Button>
                <div>
                  <button
                    className={`whitespace-pre-line text-left font-['KOROAD'] text-[1rem] font-medium leading-7 ${
                      term.required || checked ? 'text-[#111]' : 'text-[#8D8D8D]'
                    }`}
                    type="button"
                    onClick={() => toggleTerm(term.id)}
                  >
                    {term.title}
                  </button>
                  {expanded ? (
                    <p className="mt-1 whitespace-pre-line font-['KOROAD'] text-[0.75rem] font-medium leading-5 text-[#111]">
                      {term.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  unstyled
                  aria-label={`${term.title} 상세 ${expanded ? '접기' : '보기'}`}
                  className="mt-1 grid h-6 w-6 place-items-center"
                  type="button"
                  onClick={() => toggleExpanded(term.id)}
                >
                  <ChevronIcon expanded={expanded} />
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <Button
        unstyled
        className={`mt-auto flex h-[3.75rem] w-full items-center justify-center rounded-[1.125rem] font-['KOROAD'] text-[1.125rem] font-bold transition ${
          canStart ? 'bg-[#C5D89D] text-[#111] hover:bg-[#b9cf91]' : 'bg-[#EDEDED] text-[#8D8D8D]'
        }`}
        disabled={!canStart}
        type="button"
        onClick={onAgree}
      >
        동의하고 시작하기
      </Button>
    </div>
  );
}

function CheckCircle({ checked, compact = false }: { checked: boolean; compact?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 ${
        compact ? 'h-6 w-6' : 'h-7 w-7'
      } ${checked ? 'border-[#89986D] bg-[#89986D]' : 'border-[#9B9B9B] bg-white'}`}
      aria-hidden="true"
    >
      <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
        <path
          d="M1.5 6L5.4 9.8L13.5 1.8"
          stroke={checked ? '#FFFDF4' : '#8D8D8D'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={expanded ? 'rotate-180' : ''}
      fill="none"
      height="9"
      viewBox="0 0 16 9"
      width="16"
    >
      <path
        d="M1.5 1.5L8 7.5L14.5 1.5"
        stroke="#111"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}
