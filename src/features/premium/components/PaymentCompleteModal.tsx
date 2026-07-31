import { AnimatedCheckIcon } from './icons';
import { ModalShell } from './ModalShell';
import { FEATURE_CODE, findFeature, planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

export function PaymentCompleteModal({ plan, onConfirm }: { plan: SubscriptionPlanDto; onConfirm: () => void }) {
  const details = planSummary(plan);
  const adFree = findFeature(plan, FEATURE_CODE.adFree);
  return (
    <ModalShell>
      <div className="payment-check-circle mx-auto grid h-[60px] w-[60px] place-items-center rounded-full bg-[#c9dfa0]"><AnimatedCheckIcon/></div>
      <h2 className="mt-2 text-center text-[21px] font-bold">결제 완료!</h2>
      <p className="mt-1 text-center text-[12px] text-[#66705b]">프리미엄 기능이 활성화 되었어요.</p>
      <div className="relative mt-4 rounded-xl border-2 border-[#bed793] bg-white py-4 text-center text-[14px] font-bold leading-9"><span className="absolute -left-3 -top-5 -rotate-6 rounded-full bg-[#60762d] px-5 py-1 text-[12px] text-white">{details.shortName}</span>{details.shortName} 용량 업그레이드 ({details.storage})<br/>AI 블로그 {details.generations} 자동 생성{adFree?.isEnabled && <><br/>{adFree.textValue ?? adFree.name}</>}</div>
      <button className="mx-auto mt-5 block h-[51px] w-[250px] rounded-xl bg-[#879b54] font-bold text-white shadow-lg" onClick={onConfirm}>확인</button>
    </ModalShell>
  );
}
