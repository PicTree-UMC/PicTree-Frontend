import { useMemo, useState } from 'react';

import { Button } from '../../../shared/components';
import { useAgreeToTerms, useTerms } from '../hooks/useTerms';

type TermsAgreementViewProps = {
  onAgree: () => void;
};

export function TermsAgreementView({ onAgree }: TermsAgreementViewProps) {
  const { terms, isPending, isError, refetch } = useTerms();
  const { mutate: saveAgreement, isPending: isSaving } = useAgreeToTerms();
  const [checkedTerms, setCheckedTerms] = useState<Set<string>>(new Set());
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const requiredTermKeys = useMemo(
    () => terms.filter((term) => term.required).map((term) => term.key),
    [terms],
  );
  const isAllChecked = terms.length > 0 && checkedTerms.size === terms.length;
  /**
   * 필수 약관을 모두 체크해야 시작할 수 있다.
   * 목록을 아직 못 받았으면(로딩·실패) 눌리지 않게 막는다 — 빈 배열에 대한
   * `every` 는 true 라, 그대로 두면 아무것도 동의하지 않고 통과한다.
   */
  const canStart = terms.length > 0 && requiredTermKeys.every((key) => checkedTerms.has(key));

  const toggleAll = () => {
    setCheckedTerms(isAllChecked ? new Set() : new Set(terms.map((term) => term.key)));
  };

  const toggleTerm = (termId: string) => {
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

  /**
   * 동의 저장 후 다음 단계로 넘어간다. 저장이 실패하면 넘어가지 않는다 —
   * 기록이 서버에 남지 않은 채 가입이 끝나면 무엇에 동의했는지 확인할 수 없다.
   *
   * ⚠️ **약관을 못 불러왔으면 진행하지 않는다.** 그 상태로 통과시키면 동의
   * 기록 없이 가입이 끝난다. (버튼도 `canStart` 로 막혀 있지만, 여기서 한 번
   * 더 본다 — 통과하면 되돌릴 수 없는 일이라서다.)
   *
   * 반대로 목록은 받았는데 보낼 id 가 없는 경우 — 선택 약관뿐이고 아무것도
   * 체크하지 않은 상황 — 는 정상이므로 저장만 건너뛰고 넘어간다. 서버가
   * `@ArrayNotEmpty` 로 빈 배열을 거부하기 때문에 부를 수도 없다.
   */
  const handleStart = () => {
    if (terms.length === 0) {
      return;
    }

    const agreedIds = terms
      .filter((term) => checkedTerms.has(term.key))
      .map((term) => term.termId);

    if (agreedIds.length === 0) {
      onAgree();
      return;
    }

    saveAgreement(agreedIds, { onSuccess: onAgree });
  };

  const toggleExpanded = (termId: string) => {
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
        className="mt-6 flex h-[3.75rem] w-full items-center gap-4 rounded-[1.125rem] bg-[#ECF6D8] px-6 font-['KOROAD'] text-[1.125rem] font-bold text-[#111]"
        type="button"
        onClick={toggleAll}
      >
        <CheckCircle checked={isAllChecked} />
        약관 전체 동의하기
      </Button>

      <section className="mt-4 rounded-[1.125rem] bg-[#FFFDF7] px-6 py-5">
        <h2 className="mb-5 font-['KOROAD'] text-[1.125rem] font-bold text-[#111]">약관 안내</h2>
        {isPending ? (
          <p className="py-6 text-center font-['KOROAD'] text-[0.875rem] text-[#60655C]">
            약관을 불러오는 중...
          </p>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="font-['KOROAD'] text-[0.875rem] text-[#DC2626]">
              약관을 불러오지 못했어요.
            </p>
            <Button
              unstyled
              className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 font-['KOROAD'] text-[0.8125rem] font-medium text-white"
              type="button"
              onClick={() => refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : (
        <div className="space-y-4">
          {terms.map((term) => {
            const checked = checkedTerms.has(term.key);
            const expanded = expandedTerms.has(term.key);

            return (
              <article key={term.key} className="grid grid-cols-[1.75rem_1fr_1.5rem] gap-3">
                <Button
                  unstyled
                  aria-label={`${term.title} ${checked ? '동의 취소' : '동의'}`}
                  className="mt-0.5 h-6 w-6"
                  type="button"
                  onClick={() => toggleTerm(term.key)}
                >
                  <CheckCircle checked={checked} compact />
                </Button>
                <div>
                  <button
                    className={`whitespace-pre-line text-left font-['KOROAD'] text-[1rem] font-medium leading-7 ${
                      term.required || checked ? 'text-[#111]' : 'text-[#60655C]'
                    }`}
                    type="button"
                    onClick={() => toggleTerm(term.key)}
                  >
                    {term.title}
                  </button>
                  {expanded ? (
                    /*
                      서버가 주는 `summary` 를 그대로 보여준다. 없으면 약관 전문
                      링크로 대신한다 — 펼쳤는데 아무것도 없으면 무엇에 동의하는지
                      알 수 없다. (현재 실서버는 5개 모두 summary 를 채워 준다)
                    */
                    term.description ? (
                      <p className="mt-1 whitespace-pre-line font-['KOROAD'] text-[0.75rem] font-medium leading-5 text-[#111]">
                        {term.description}
                      </p>
                    ) : term.contentUrl ? (
                      <a
                        href={term.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block font-['KOROAD'] text-[0.75rem] font-medium leading-5 text-[#5B6B38] underline"
                      >
                        약관 전문 보기
                      </a>
                    ) : null
                  ) : null}
                </div>
                <Button
                  unstyled
                  aria-label={`${term.title} 상세 ${expanded ? '접기' : '보기'}`}
                  className="mt-1 grid h-6 w-6 place-items-center"
                  type="button"
                  onClick={() => toggleExpanded(term.key)}
                >
                  <ChevronIcon expanded={expanded} />
                </Button>
              </article>
            );
          })}
        </div>
        )}
      </section>

      <Button
        unstyled
        className={`mt-auto flex h-[3.75rem] w-full items-center justify-center rounded-[1.125rem] font-['KOROAD'] text-[1.125rem] font-bold transition ${
          canStart ? 'bg-[#C5D89D] text-[#111] hover:bg-[#c5d89d]' : 'bg-[#EDEDED] text-[#60655C]'
        }`}
        disabled={!canStart || isSaving}
        type="button"
        onClick={handleStart}
      >
        {isSaving ? '저장 중...' : '동의하고 시작하기'}
      </Button>
    </div>
  );
}

function CheckCircle({ checked, compact = false }: { checked: boolean; compact?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 ${
        compact ? 'h-6 w-6' : 'h-7 w-7'
      } ${checked ? 'border-[#788F4A] bg-[#788F4A]' : 'border-[#9B9B9B] bg-white'}`}
      aria-hidden="true"
    >
      <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
        <path
          d="M1.5 6L5.4 9.8L13.5 1.8"
          stroke={checked ? '#FFFDF4' : '#60655C'}
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
