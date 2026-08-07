import { planBenefitLines, planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-[3px] h-4 w-4 shrink-0" aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7"
        fill="none"
        stroke="#5B6B38"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  plan: SubscriptionPlanDto;
  /**
   * 서버에 배지 필드가 없어 목록에서의 자리로 정한다(`PremiumPage` 가 넘긴다).
   * 예전 `PlanCard` 는 '추천'(끝에서 두 번째)과 '최대'(가장 비싼 것) 둘을 달았는데,
   * 카드가 커지면서 '최대'는 뺐다 — 카드에 이미 제일 큰 숫자들이 적혀 있어 배지가
   * 같은 말을 반복한다. 고르는 데 도움이 되는 건 '어느 걸 사야 하나' 쪽뿐이다.
   */
  recommended?: boolean;
  onStart: () => void;
};

/**
 * 플랜 하나를 소개하는 카드 + 그 플랜으로 바로 결제를 여는 CTA.
 *
 * **카드마다 CTA 가 붙는다.** 종전에는 라디오로 하나를 고른 뒤 페이지 맨 아래 버튼
 * 하나로 결제했는데, 그러면 고른 값을 기억한 채 아래로 내려가야 하고 어느 플랜을
 * 골랐는지 버튼 문구로만 확인된다. 유튜브 프리미엄처럼 카드 안에서 끝내면 값과 행동이
 * 붙어 있어 헷갈릴 자리가 없다.
 *
 * 값(이름·가격·혜택)은 전부 `GET /subscription-plans` 에서 온다 — lib/planDisplay 참고.
 */
export function PlanIntroCard({ plan, recommended, onStart }: Props) {
  const details = planSummary(plan);
  const benefits = planBenefitLines(plan);

  return (
    <section
      className={`relative rounded-2xl bg-white px-5 py-5 ${
        recommended ? 'border-2 border-pictree-500' : 'border border-[#ECECEC]'
      }`}
    >
      {recommended && (
        // 테두리 위에 걸치게 올린다 — 카드 안에 두면 제목 줄을 밀어 카드마다 높이가 어긋난다.
        <em className="absolute -top-[11px] left-5 rounded-full bg-pictree-700 px-2.5 py-1 text-[13px] not-italic text-white">
          추천
        </em>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-medium text-[#2C3930]">{details.name}</h3>
        <p className="shrink-0 text-[15px] text-[#2C3930]">
          <strong className="text-[17px] font-medium">{details.price}</strong>
          <span className="text-[#60655C]"> / 월</span>
        </p>
      </div>

      {/* 서버 description. 없을 수도 있어서 있을 때만 자리를 준다. */}
      {details.description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#60655C]">{details.description}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {benefits.map((line) => (
          <li key={line} className="flex items-start gap-2 text-[15px] text-[#2C3930]">
            <CheckIcon />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 h-12 w-full rounded-xl bg-pictree-700 text-[15px] font-medium text-white"
      >
        {details.shortName} 시작하기
      </button>
    </section>
  );
}
