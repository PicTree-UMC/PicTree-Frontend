import { Chip } from '@/shared/components';
import { findFeature, formatFeatureValue, planSummary, sortedFeatures } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * 서버 혜택이 아니다 — 요금제와 무관하게 무제한이라 `/subscription-plans` 에 안 들어있다.
 * 그래도 비교표에 남긴다: 무료로 어디까지 되는지가 유료 전환 판단의 절반이라, "기록 자체는
 * 원래 무제한" 이라는 사실이 빠지면 표가 실제보다 인색해 보인다. 서버에 생기면 이 상수를 지운다.
 */
const STATIC_ROW = { label: '타임라인 · 동선 저장', free: '무제한', paid: '무제한' };

type Props = {
  freePlan: SubscriptionPlanDto;
  paidPlans: SubscriptionPlanDto[];
  selectedId: number;
  onSelect: (id: number) => void;
};

/**
 * 무료 ↔ 고른 유료 플랜을 나란히 놓는 비교표. 위의 피커바로 어느 플랜과 견줄지 고른다.
 *
 * **한 번에 두 열만 보여준다.** 종전 `BenefitTable` 은 유료 열 하나에 전 플랜을 범위로
 * 접어 넣었는데('1GB~20GB', '월 5~50회'), 범위는 어느 플랜이 그 값을 주는지를 말해주지
 * 않는다 — 고르는 데 쓸 수 없는 숫자다. 유료 플랜을 전부 열로 펼치는 방법도 있지만 390px
 * 폭에 3열이 들어가면 값이 두 줄로 접힌다. 그래서 피커로 갈아끼운다.
 *
 * 줄은 무료 플랜의 혜택 목록을 기준으로 만든다. 유료에만 있는 코드는 안 그려지는데,
 * 지금 서버는 세 플랜이 같은 코드 집합(용량·AI 블로그·광고)을 쓴다.
 */
export function PlanComparison({ freePlan, paidPlans, selectedId, onSelect }: Props) {
  const selected = paidPlans.find((p) => p.id === selectedId) ?? paidPlans[0];
  if (!selected) return null;

  const rows = sortedFeatures(freePlan).map((feature) => ({
    label: feature.name,
    free: formatFeatureValue(feature),
    paid: formatFeatureValue(findFeature(selected, feature.code)),
  }));
  rows.splice(1, 0, STATIC_ROW); // 사진 용량 바로 아래

  return (
    <section>
      <h2 className="text-[17px] font-medium text-[#2C3930]">플랜 비교</h2>
      <p className="mt-1 text-[13px] text-[#60655C]">
        보고 싶은 플랜을 고르면 무료와 나란히 견줘 볼 수 있어요.
      </p>

      {/*
        피커바. 라디오 그룹이라 Chip 에 role/aria-checked 를 직접 넘긴다(§5) —
        `selected` 만 넘기면 aria-pressed 가 붙어 토글로 낭독된다.
        플랜이 늘어도 390px 안에서 버티도록 가로 스크롤.
      */}
      <div
        role="radiogroup"
        aria-label="비교할 플랜"
        className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {paidPlans.map((plan) => {
          const isActive = plan.id === selected.id;
          return (
            <Chip
              key={plan.id}
              tone="outline"
              selected={isActive}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(plan.id)}
            >
              {planSummary(plan).shortName}
            </Chip>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#ECECEC] bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-[#ECECEC] px-4 py-3 text-[13px] text-[#60655C]">
          <span>혜택</span>
          <span className="text-center">무료</span>
          <span className="text-center text-[#5B6B38]">{planSummary(selected).shortName}</span>
        </div>

        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3.5 text-[15px] ${
              i > 0 ? 'border-t border-[#ECECEC]' : ''
            }`}
          >
            <span className="text-[#2C3930]">{row.label}</span>
            {/*
              무료 열을 흐리게 하지 않는다 — 비교 대상이지 비활성이 아니다(§5 의 칩 규칙과 같은 이유).
              차이는 유료 열에 색을 주는 쪽으로만 낸다.
            */}
            <span className="text-center text-[#60655C]">{row.free}</span>
            <span className="text-center font-medium text-[#5B6B38]">{row.paid}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
