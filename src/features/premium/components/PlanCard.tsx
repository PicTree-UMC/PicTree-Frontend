import { PLAN_DETAILS, type SubscriptionPlan } from '../types/premium';

type Props = { plan: SubscriptionPlan; selected: boolean; recommended?: boolean; best?: boolean; onClick: () => void };

export function PlanCard({ plan, selected, recommended, best, onClick }: Props) {
  const details = PLAN_DETAILS[plan];
  return (
    <button className={`relative flex h-[75px] w-full items-center rounded-xl border-2 bg-white px-[10px] text-left ${selected ? 'border-[#83965c]' : 'border-[#bed793]'}`} onClick={onClick} aria-pressed={selected}>
      {(recommended || best) && <em className={`absolute right-2 top-1 rounded-full px-2 py-0.5 text-[9px] not-italic text-white ${best ? 'bg-[#8da071]' : 'bg-[#e7bd5b]'}`}>{best ? '최대' : '추천'}</em>}
      <span className={`mr-3 grid h-[22px] w-[22px] place-items-center rounded-full border-2 ${selected ? 'border-[#6f873d]' : 'border-[#aab991]'}`}>{selected && <i className="h-3 w-3 rounded-full bg-[#6f873d]" />}</span>
      <span className="min-w-0"><strong className="whitespace-nowrap text-[15px]">{details.name} · {details.storage} · AI 블로그 {details.generations}</strong><small className="block truncate text-[9px] text-[#999]">{details.description}</small></span>
      <strong className="ml-auto shrink-0 whitespace-nowrap text-[14px]">{details.price} / 월</strong>
    </button>
  );
}
