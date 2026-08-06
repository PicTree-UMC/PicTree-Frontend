import { FEATURE_CODE, findFeature, formatFeatureRange, formatFeatureValue } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * 시안 순서. 서버 features[] 는 코드 알파벳순으로 와서 그대로 그리면 순서가 어긋난다.
 * 여기 없는 코드는 뒤에 붙는다 — 혜택이 추가돼도 화면 코드를 안 고치기 위해서다.
 */
const ROW_ORDER: string[] = [
  FEATURE_CODE.photoStorage,
  FEATURE_CODE.aiBlogMonthly,
  FEATURE_CODE.adFree,
];

/**
 * 서버 혜택이 아니다 — 요금제와 무관하게 무제한이라 /subscription-plans 에 들어있지 않다.
 * 유료 전환 근거로 시안에 있는 줄이라 남긴다. 서버에 생기면 이 상수를 지운다.
 */
const STATIC_ROW = { label: '타임라인 · 동선 저장', free: '무제한', premium: '무제한' };

const orderOf = (code: string) => {
  const i = ROW_ORDER.indexOf(code);
  return i === -1 ? ROW_ORDER.length : i;
};

export function BenefitTable({ plans }: { plans: SubscriptionPlanDto[] }) {
  const free = plans.find((p) => p.price === 0);
  const paid = plans.filter((p) => p.price > 0); // 가격 오름차순 (useSubscriptionPlans 가 정렬)
  const cheapest = paid[0];
  const priciest = paid[paid.length - 1];
  if (!free || !cheapest) return null;

  const rows = [...free.features]
    .sort((a, b) => orderOf(a.code) - orderOf(b.code))
    .map((feature) => ({
      label: feature.name,
      free: formatFeatureValue(feature),
      premium: formatFeatureRange(
        findFeature(cheapest, feature.code),
        findFeature(priciest, feature.code),
      ),
    }));
  rows.splice(1, 0, STATIC_ROW); // 시안상 사진 용량 바로 아래

  return (
    <div className="mt-7 rounded-xl bg-white px-[22px] py-[18px] shadow-sm">
      <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-pictree-500 pb-4 text-[14px] font-bold"><span>혜택 비교</span><span className="text-center">무료</span><span className="text-right">프리미엄</span></div>
      {rows.map((row) => <div key={row.label} className="grid grid-cols-[1.5fr_1fr_1fr] py-[11px] text-[15px] font-bold"><span>{row.label}</span><span className="text-center text-[12px] font-medium text-[#999]">{row.free}</span><span className="text-right text-pictree-700">{row.premium}</span></div>)}
    </div>
  );
}
