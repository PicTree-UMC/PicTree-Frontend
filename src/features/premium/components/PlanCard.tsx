import { planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * badge 는 서버에 없는 값이라 PremiumPage 가 순서로 정해서 내려준다.
 * (시안: 위에서 두 번째 '추천', 가장 비싼 것 '최대')
 */
type Props = {
  plan: SubscriptionPlanDto;
  selected: boolean;
  badge?: '추천' | '최대';
  onClick: () => void;
};

export function PlanCard({ plan, selected, badge, onClick }: Props) {
  const details = planSummary(plan);
  return (
    <button className={`relative flex h-[75px] w-full items-center rounded-xl border-2 bg-white px-[10px] text-left ${selected ? 'border-pictree-500' : 'border-pictree-300'}`} onClick={onClick} aria-pressed={selected}>
      {badge && <em className={`absolute right-2 top-1 rounded-full px-2 py-0.5 text-[9px] not-italic text-white ${badge === '최대' ? 'bg-pictree-700' : 'bg-[#e7bd5b]'}`}>{badge}</em>}
      <span className={`mr-3 grid h-[22px] w-[22px] place-items-center rounded-full border-2 ${selected ? 'border-pictree-700' : 'border-pictree-500'}`}>{selected && <i className="h-3 w-3 rounded-full bg-pictree-700" />}</span>
      <span className="min-w-0 flex-1"><strong className="block truncate text-[15px]">{details.shortName} · {details.storage} · AI 블로그 {details.generations}</strong><small className="block truncate text-[9px] text-[#999]">{details.description}</small></span>
      <strong className="ml-auto shrink-0 whitespace-nowrap text-[14px]">{details.price} / 월</strong>
    </button>
  );
}
