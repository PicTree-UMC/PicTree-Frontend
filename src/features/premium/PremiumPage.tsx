import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { BenefitTable } from './components/BenefitTable';
import { CrownIcon } from './components/icons';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import { PaymentConfirmSheet } from './components/PaymentConfirmSheet';
import { PlanCard } from './components/PlanCard';
import { useBillingCheckout } from './hooks/useBillingCheckout';
import { PLAN_DETAILS, type PaymentStep, type SubscriptionPlan } from './types/premium';

export function PremiumPage() {
  const navigate = useNavigate();
  const checkout = useBillingCheckout();
  const [plan, setPlan] = useState<SubscriptionPlan>('max');
  const [step, setStep] = useState<PaymentStep>('plan');
  const selectedPlan = PLAN_DETAILS[plan];

  const handlePayment = () => {
    // customerKey 발급 → 토스 카드 인증창 → 성공 시 BillingSuccessPage 로 리다이렉트.
    // 빌링키 발급·구독 시작은 그 착지 페이지가 이어받는다. 아래 complete 스텝은 안 쓰인다.
    checkout.mutate(plan);
  };

  const handleComplete = () => {
    // 프리미엄 여부는 이제 서버(useMySubscription)가 진실이라 로컬 플래그를 세우지 않는다.
    // (이 complete 스텝 자체가 현재 트리거되지 않는 잔여 코드다 — 실제 완료는 BillingSuccessPage.)
    navigate(ROUTES.blog);
  };

  return (
    <main className="min-h-full w-full bg-[linear-gradient(#c9dfa0_0%,#eef4dc_62%,#fffdf4_100%)] px-[15px] pb-8 pt-[72px] text-[#20251f]">
      <div className="flex flex-col items-center"><CrownIcon/><h1 className="mt-2 text-[24px] font-bold">프리미엄으로 업그레이드</h1><p className="mt-1 text-[14px]">나의 여행을 더 특별하게 기록하세요</p></div>
      <BenefitTable/>
      <h2 className="mb-2 mt-3 text-[14px] font-bold">플랜 선택</h2>
      <PlanCard plan="plus" selected={plan === 'plus'} onClick={() => setPlan('plus')} />
      <div className="mt-2"><PlanCard plan="pro" selected={plan === 'pro'} recommended onClick={() => setPlan('pro')} /></div>
      <div className="mt-2"><PlanCard plan="max" selected={plan === 'max'} best onClick={() => setPlan('max')} /></div>
      <button className="mt-3 h-[51px] w-full rounded-xl bg-[#879b54] text-[16px] font-bold text-white shadow-lg" onClick={() => setStep('confirm')}>월 {selectedPlan.price}으로 시작하기</button>
      <p className="mt-3 text-center text-[10px] leading-4">무료 플랜은 AI 블로그 작성 1회를 제공합니다.<br/>결제 후 즉시 저장 용량과 월 작성 횟수가 적용됩니다.<br/>언제든 상위 요금제로 변경하거나 구독을 취소할 수 있습니다.</p>
      {step === 'confirm' && <PaymentConfirmSheet plan={plan} onCancel={() => setStep('plan')} onPay={handlePayment}/>} 
      {step === 'complete' && <PaymentCompleteModal plan={plan} onConfirm={handleComplete}/>} 
    </main>
  );
}
