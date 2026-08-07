import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import { PaymentConfirmSheet } from './components/PaymentConfirmSheet';
import { PlanComparison } from './components/PlanComparison';
import { PlanIntroCard } from './components/PlanIntroCard';
import { PremiumFaq } from './components/PremiumFaq';
import { PremiumHero } from './components/PremiumHero';
import { useBillingCheckout } from './hooks/useBillingCheckout';
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans';
import type { PaymentStep } from './types/premium';

/**
 * 페이지 배경 그라데이션.
 *
 * 결제 페이지만 크림 단색(§1.1)에서 벗어난다 — 앱에서 유일하게 무언가를 파는 화면이라
 * 다른 화면과 같은 바닥이면 그냥 또 하나의 설정 화면으로 읽힌다. 유튜브 프리미엄도 같은
 * 이유로 이 페이지에만 다른 바탕을 쓴다.
 *
 * 색은 새로 만들지 않고 앱에 있던 것을 되살렸다 — 즐겨찾기 화면의 '저장한 장소' 정렬
 * 버튼이 쓰던 `#ECF6D8 → #FFF6D1` 이다(`1bcf851` 에서 프로필 재디자인과 함께 사라졌다).
 *
 * ⚠️ **그 두 색만으로는 페이지에서 안 보인다.** L* 가 95 와 96.5 로 사실상 같은 밝기고
 * 노랑 쪽으로 색상만 살짝 도는 값이라, 40px 짜리 버튼에서는 충분했지만 화면 전체에 깔면
 * 단색으로 읽힌다. 그래서 **맨 위 30% 에 GREEN-300 을 얹어** 실제로 기울기가 보이게 했다
 * (L* 84 → 95 → 96.5). 참고한 유튜브 프리미엄도 같은 얼개다 — 위쪽에 색이 몰리고 아래로
 * 갈수록 흰색에 가까워진다. 종전 이 페이지의 그라데이션도 GREEN-300 에서 시작했다.
 *
 * 세 값 모두 canonical 이거나(§1.1 GREEN-300·GREEN-100) 되살린 원래 값이다 — 눈대중
 * 중간색을 새로 만들지 않았다(§1.2).
 *
 * INK(`#2C3930`) 대비는 위 끝 7.9:1, 아래 끝 11.2:1 로 전 구간 AA 이상이다.
 *
 * ⚠️ **콘텐츠에 붙이지 않고 뒤에 깐다.** 페이지가 길어서 배경에 직접 걸면 그라데이션이
 * 2,500px 넘게 늘어나 색이 거의 안 변한다. 뷰포트를 덮는 고정 레이어로 두면 스크롤과
 * 무관하게 의도한 폭으로 유지되고, 노치까지 덮는다(§3 의 full-bleed 방식).
 */
const BACKDROP_CLASS =
  'fixed inset-0 -z-10 mx-auto sm:max-w-[390px] bg-[linear-gradient(180deg,#C5D89D_0%,#ECF6D8_30%,#FFF6D1_100%)]';

export function PremiumPage() {
  const navigate = useNavigate();
  const checkout = useBillingCheckout();
  const { data: plans = [], isLoading, isError, refetch } = useSubscriptionPlans();
  const [step, setStep] = useState<PaymentStep>('plan');
  /** 결제하려고 고른 플랜(카드 CTA 가 정한다). 확인 시트가 이걸 보고 그린다. */
  const [checkoutId, setCheckoutId] = useState<number | null>(null);
  /** 비교표에서 무료와 견줄 플랜. 결제 대상과는 별개다 — 훑어보는 것과 사는 건 다르다. */
  const [comparedId, setComparedId] = useState<number | null>(null);

  const freePlan = plans.find((p) => p.price === 0);
  const paidPlans = plans.filter((p) => p.price > 0); // 가격 오름차순 (useSubscriptionPlans 가 정렬)
  const checkoutPlan = paidPlans.find((p) => p.id === checkoutId);

  const openConfirm = (planId: number) => {
    setCheckoutId(planId);
    setStep('confirm');
  };

  const handlePayment = () => {
    if (!checkoutPlan) return;
    // customerKey 발급 → 토스 카드 인증창 → 성공 시 BillingSuccessPage 로 리다이렉트.
    // 빌링키 발급·구독 시작은 그 착지 페이지가 이어받는다. 아래 complete 스텝은 안 쓰인다.
    checkout.mutate(checkoutPlan.id);
  };

  const handleComplete = () => {
    // 프리미엄 여부는 이제 서버(useMySubscription)가 진실이라 로컬 플래그를 세우지 않는다.
    // (이 complete 스텝 자체가 현재 트리거되지 않는 잔여 코드다 — 실제 완료는 BillingSuccessPage.)
    navigate(ROUTES.blog);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-3 px-5">
        <div className={BACKDROP_CLASS} />
        <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-700" />
        <p className="text-[15px] font-medium text-[#5B6B38]">요금제를 불러오는 중...</p>
      </main>
    );
  }

  // 요금제를 못 받으면 결제 자체가 불가능하다. 유료 플랜이 하나도 없는 경우도 같은 취급 —
  // 값 없이 카드를 그리면 예전처럼 하드코딩으로 되돌아가게 된다.
  if (isError || !freePlan || paidPlans.length === 0) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 px-5">
        <div className={BACKDROP_CLASS} />
        <p className="text-center text-[15px] font-medium text-[#2C3930]">
          요금제를 불러오지 못했어요
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-12 rounded-xl bg-pictree-700 px-8 text-[15px] font-medium text-white"
        >
          다시 시도
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-full pb-nav text-[#2C3930]">
      <div className={BACKDROP_CLASS} />

      <PremiumHero />

      {/* 섹션 사이는 gap-10. 각 섹션이 자기 제목을 갖고 있어 이만큼 떨어져야 묶음이 읽힌다. */}
      <div className="mt-10 flex flex-col gap-10 px-5">
        <section className="flex flex-col gap-4">
          {paidPlans.map((plan, i) => (
            <PlanIntroCard
              key={plan.id}
              plan={plan}
              // 가장 비싼 것 바로 앞을 '추천' 으로 — 종전 PlanCard 의 규칙 그대로다.
              // 유료가 하나뿐이면 그것이 곧 유일한 선택이라 배지를 달지 않는다.
              recommended={paidPlans.length > 1 && i === paidPlans.length - 2}
              onStart={() => openConfirm(plan.id)}
            />
          ))}
        </section>

        <PlanComparison
          freePlan={freePlan}
          paidPlans={paidPlans}
          // 기본은 가장 비싼 플랜 — 혜택 차이가 가장 크게 보이는 열이다.
          selectedId={comparedId ?? paidPlans[paidPlans.length - 1].id}
          onSelect={setComparedId}
        />

        <PremiumFaq />

        {/*
          결제 고지. 13px 로 올렸다(종전 10px 은 §2 의 최소 13px 위반이었다).
          '무료 체험'·'상위 요금제로 변경' 은 근거가 없어 빠졌다 — constants/premiumFaq.ts 주석 참고.
        */}
        <p className="text-center text-[13px] leading-relaxed text-[#60655C]">
          결제 후 즉시 저장 용량과 월 작성 횟수가 적용돼요.
          <br />
          매월 자동으로 갱신되고, 다음 결제일 전까지 언제든 해지할 수 있어요.
        </p>
      </div>

      {step === 'confirm' && checkoutPlan && (
        <PaymentConfirmSheet
          plan={checkoutPlan}
          onCancel={() => setStep('plan')}
          onPay={handlePayment}
        />
      )}
      {step === 'complete' && checkoutPlan && (
        <PaymentCompleteModal plan={checkoutPlan} onConfirm={handleComplete} />
      )}
    </main>
  );
}
