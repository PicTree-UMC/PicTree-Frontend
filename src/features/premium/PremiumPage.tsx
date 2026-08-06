import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { BenefitTable } from './components/BenefitTable';
import { CrownIcon } from './components/icons';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import { PaymentConfirmSheet } from './components/PaymentConfirmSheet';
import { PlanCard } from './components/PlanCard';
import { useBillingCheckout } from './hooks/useBillingCheckout';
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans';
import { FEATURE_CODE, findFeature, planSummary } from './lib/planDisplay';
import type { PaymentStep } from './types/premium';

// pt 에 safe-area 를 더해 시안의 72px 여백을 상단 안전영역 위에 얹는다.
const PAGE_CLASS =
  'min-h-full w-full bg-[linear-gradient(#c5d89d_0%,#eef4dc_62%,#fffdf4_100%)] px-[15px] pb-nav pt-[calc(env(safe-area-inset-top)+72px)] text-[#2c3930]';

export function PremiumPage() {
  const navigate = useNavigate();
  const checkout = useBillingCheckout();
  const { data: plans = [], isLoading, isError, refetch } = useSubscriptionPlans();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [step, setStep] = useState<PaymentStep>('plan');

  const freePlan = plans.find((p) => p.price === 0);
  const paidPlans = plans.filter((p) => p.price > 0); // 가격 오름차순
  // 기본 선택은 시안대로 가장 비싼 플랜. 요금제가 늘어도 하드코딩('max') 없이 따라간다.
  const selectedPlan =
    paidPlans.find((p) => p.id === selectedId) ?? paidPlans[paidPlans.length - 1];

  const freeAiBlog = freePlan && findFeature(freePlan, FEATURE_CODE.aiBlogMonthly);

  const handlePayment = () => {
    if (!selectedPlan) return;
    // customerKey 발급 → 토스 카드 인증창 → 성공 시 BillingSuccessPage 로 리다이렉트.
    // 빌링키 발급·구독 시작은 그 착지 페이지가 이어받는다. 아래 complete 스텝은 안 쓰인다.
    checkout.mutate(selectedPlan.id);
  };

  const handleComplete = () => {
    // 프리미엄 여부는 이제 서버(useMySubscription)가 진실이라 로컬 플래그를 세우지 않는다.
    // (이 complete 스텝 자체가 현재 트리거되지 않는 잔여 코드다 — 실제 완료는 BillingSuccessPage.)
    navigate(ROUTES.blog);
  };

  if (isLoading) {
    return (
      <main className={`${PAGE_CLASS} flex flex-col items-center justify-center gap-3`}>
        <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#788f4a]" />
        <p className="text-[15px] font-medium text-[#5b6b38]">요금제를 불러오는 중...</p>
      </main>
    );
  }

  // 요금제를 못 받으면 결제 자체가 불가능하다. 빈 배열도 같은 취급 — 값 없이 카드를 그리면
  // 예전처럼 하드코딩으로 되돌아가게 된다.
  if (isError || !selectedPlan) {
    return (
      <main className={`${PAGE_CLASS} flex flex-col items-center justify-center gap-4`}>
        <p className="text-center text-[15px] font-medium text-[#2c3930]">
          요금제를 불러오지 못했어요
        </p>
        <button
          onClick={() => refetch()}
          className="h-[46px] rounded-[24px] bg-[#788f4a] px-8 text-[15px] font-medium text-white"
        >
          다시 시도
        </button>
      </main>
    );
  }

  return (
    <main className={PAGE_CLASS}>
      <div className="flex flex-col items-center"><CrownIcon/><h1 className="mt-2 text-[24px] font-bold">프리미엄으로 업그레이드</h1><p className="mt-1 text-[14px]">나의 여행을 더 특별하게 기록하세요</p></div>
      <BenefitTable plans={plans}/>
      <h2 className="mb-2 mt-3 text-[14px] font-bold">플랜 선택</h2>
      <div className="flex flex-col gap-2">
        {paidPlans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlan.id}
            // 서버에 배지 필드가 없어 순서로 정한다: 가장 비싼 게 '최대', 그 앞이 '추천'.
            badge={i === paidPlans.length - 1 ? '최대' : i === paidPlans.length - 2 ? '추천' : undefined}
            onClick={() => setSelectedId(plan.id)}
          />
        ))}
      </div>
      <button className="mt-3 h-[51px] w-full rounded-xl bg-[#788f4a] text-[16px] font-bold text-white shadow-lg" onClick={() => setStep('confirm')}>월 {planSummary(selectedPlan).price}으로 시작하기</button>
      <p className="mt-3 text-center text-[10px] leading-4">{freeAiBlog?.isEnabled && <>무료 플랜은 AI 블로그 작성 {freeAiBlog.limitValue}회를 제공합니다.<br/></>}결제 후 즉시 저장 용량과 월 작성 횟수가 적용됩니다.<br/>언제든 상위 요금제로 변경하거나 구독을 취소할 수 있습니다.</p>
      {step === 'confirm' && <PaymentConfirmSheet plan={selectedPlan} onCancel={() => setStep('plan')} onPay={handlePayment}/>}
      {step === 'complete' && <PaymentCompleteModal plan={selectedPlan} onConfirm={handleComplete}/>}
    </main>
  );
}
