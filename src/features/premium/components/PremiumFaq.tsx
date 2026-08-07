import { useState } from 'react';
import { PREMIUM_FAQ } from '../constants/premiumFaq';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="#2C3930"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * 결제 전에 걸리는 것들을 푸는 아코디언.
 *
 * 기본은 전부 접혀 있다 — 다섯 개를 다 펼쳐 두면 페이지 끝이 글로 막혀 결제 버튼까지
 * 돌아가는 길이 멀어진다. 열림은 하나만 유지한다(`HelpFaqPage` 와 같은 방식).
 *
 * 도움말 화면(`profile/HelpFaqPage`)과 겉모습이 같지만 컴포넌트를 공유하지 않았다.
 * 그쪽은 카테고리 탭 + 문의처가 붙은 한 화면 전체이고 여기는 페이지 안의 한 섹션이라,
 * 지금 합치면 쓰이지 않는 슬롯이 딸린 컴포넌트가 된다. 세 번째 아코디언이 생기면 그때
 * 줄 하나(`FaqAccordionItem`)만 공용으로 뽑는 게 맞다.
 */
export function PremiumFaq() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-[17px] font-medium text-[#2C3930]">자주 묻는 질문</h2>

      <div className="mt-4 flex flex-col gap-2.5">
        {PREMIUM_FAQ.map((item) => {
          const isOpen = openQuestion === item.q;

          return (
            <div key={item.q} className="rounded-xl border border-[#ECECEC] bg-white px-4 py-3.5">
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 text-left"
              >
                <h3 className="flex-1 text-[15px] font-medium text-[#2C3930]">{item.q}</h3>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#60655C]">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
