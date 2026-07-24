import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { BenefitTable } from './components/BenefitTable';
import { CrownIcon } from './components/icons';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import { PaymentConfirmSheet } from './components/PaymentConfirmSheet';
import { PlanCard } from './components/PlanCard';
import { useSubscriptionStore } from './store/subscriptionStore';
import type { PaymentStep, SubscriptionPlan } from './types/premium';

export function PremiumPage() {
  const navigate = useNavigate();
  const activate = useSubscriptionStore((state) => state.activate);
  const [plan, setPlan] = useState<SubscriptionPlan>('annual');
  const [step, setStep] = useState<PaymentStep>('plan');
  const isAnnual = plan === 'annual';

  const handlePayment = () => {
    // TODO: 토스페이먼츠 결제 승인 API 성공 후 complete 상태로 전환
    setStep('complete');
  };

  const handleComplete = () => {
    activate(plan);
    navigate(ROUTES.blog);
  };

  return (
    <main className="min-h-full w-full bg-[linear-gradient(#c9dfa0_0%,#eef4dc_62%,#fffdf4_100%)] px-5 pb-8 pt-[72px] text-[#20251f]">
      <button className="absolute right-5 top-5 text-sm text-[#58614d]" onClick={() => navigate(-1)}>닫기</button>
      <div className="flex flex-col items-center"><CrownIcon/><h1 className="mt-2 text-[24px] font-bold">프리미엄으로 업그레이드</h1><p className="mt-1 text-[14px]">나의 여행을 더 특별하게 기록하세요</p></div>
      <BenefitTable/>
      <h2 className="mb-3 mt-4 text-[14px] font-bold">플랜 선택</h2>
      <PlanCard selected={!isAnnual} title="월간 구독" description="매월 자동 갱신" price="4,900원 / 월" onClick={() => setPlan('monthly')} />
      <div className="mt-2"><PlanCard selected={isAnnual} title="연간 구독" description="연 39,000원 (월 3,250원)" price="39,900원 / 연" recommended onClick={() => setPlan('annual')} /></div>
      <button className="mt-3 h-[51px] w-full rounded-xl bg-[#879b54] text-[16px] font-bold text-white shadow-lg" onClick={() => setStep('confirm')}>{isAnnual ? '연 39,900원으로 시작하기' : '월 4,900원으로 시작하기'}</button>
      <p className="mt-4 text-center text-[10px]">구독은 언제든 취소할 수 있습니다. 결제 후 즉시 프리미엄 혜택이 적용됩니다.</p>
      {step === 'confirm' && <PaymentConfirmSheet plan={plan} onCancel={() => setStep('plan')} onPay={handlePayment}/>} 
      {step === 'complete' && <PaymentCompleteModal onConfirm={handleComplete}/>} 
    </main>
  );
}
