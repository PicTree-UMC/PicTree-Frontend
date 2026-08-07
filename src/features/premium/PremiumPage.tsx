import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, useToast } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { ROUTES } from '../../shared/constants/routes';
import { BenefitShowcase } from './components/BenefitShowcase';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import { PaymentConfirmSheet } from './components/PaymentConfirmSheet';
import { PlanCheckoutButton } from './components/PlanCheckoutButton';
import { PlanComparison } from './components/PlanComparison';
import { PremiumFaq } from './components/PremiumFaq';
import { PremiumHero } from './components/PremiumHero';
import { SubscriptionCancelSection } from './components/SubscriptionCancelSection';
import { useBillingCheckout } from './hooks/useBillingCheckout';
import { useBillingKeys } from './hooks/useBillingKeys';
import { useMySubscription } from './hooks/useMySubscription';
import { useSubscribeWithCard } from './hooks/useSubscriptionActions';
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans';
import { findActiveCard } from './lib/billingKey';
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
 *
 * ⚠️⚠️ **`-z-10` 을 쓰면 안 된다 — 이 레이어가 통째로 안 보인다.** 한 번 그렇게 넣었다가
 * 화면이 크림 단색으로 나왔다. CSS 페인트 순서(CSS 2.1 Appendix E)에서
 *   2단계 = 음수 z-index 후손 · 3단계 = 흐름상 블록 후손의 **배경**
 * 인데, `AppShell` 의 안쪽 div 가 `bg-[#fffcef]` 를 든 흐름상 블록이라 3단계에서 칠해진다.
 * 즉 음수 z 레이어는 앱 배경보다 **아래**에 깔려 크림이 그대로 덮는다. 빌드된 CSS 에는
 * 멀쩡히 들어가 있어서 '적용이 안 됐다'로 보이지만 실제로는 '가려졌다' 다.
 *
 * 그래서 **레이어는 `z-0`(6단계: 위치 지정 + z-index 0), 콘텐츠는 `relative z-10`(7단계)**
 * 로 올린다. 둘 다 3단계보다 뒤에 칠해지므로 앱 배경 위에 놓인다. 하단 탭바(z-40)와
 * 포털로 나가는 시트·모달은 이보다 위라 영향 없다.
 */
const BACKDROP_CLASS =
  'fixed inset-0 z-0 mx-auto sm:max-w-[390px] bg-[linear-gradient(180deg,#C5D89D_0%,#ECF6D8_30%,#FFF6D1_100%)]';

/**
 * 이 페이지의 헤더 — 뒤로가기 하나뿐이다.
 *
 * **제목을 안 단다.** 바로 아래 히어로 헤드라인(27px)이 이 화면이 무엇인지 이미 말한다.
 * 그 위에 18px '프리미엄' 을 얹으면 제목이 두 줄로 겹쳐 읽힌다. 다른 화면들이 제목을 다는
 * 건 본문이 목록·폼이라 스스로를 설명하지 못하기 때문이고, 여기는 그 경우가 아니다.
 *
 * `BackButton` 의 흰 원은 이 배경 맨 위(GREEN-300 `#C5D89D`) 위에서 또렷하다 — 원을 얹는
 * 세 바닥 중 하나로 이미 계산된 값이다(`BackButton` 주석 참고).
 *
 * 로딩·에러 화면에도 같이 넣는다. 요금제를 못 받았다고 뒤로 갈 길까지 막히면 안 된다.
 */
function PremiumNavBar() {
  // 히스토리가 없을 때(주소 직접 입력, PWA 첫 화면, 토스 결제 착지 후)는 프로필로 —
  // '구독 및 결제' 가 이 화면의 주 입구가 되면서 그쪽이 부모 자리다.
  const goBack = useGoBack(ROUTES.profile);

  return (
    <header className="px-5 pt-header">
      <NavBar onBack={goBack} />
    </header>
  );
}

export function PremiumPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const checkout = useBillingCheckout();
  const { data: plans = [], isLoading, isError, refetch } = useSubscriptionPlans();
  const { data: subscription } = useMySubscription();
  /*
    등록된 카드가 있으면 그 카드로 앱 안에서 결제한다. 없으면 종전처럼 토스 인증창을
    연다 — 두 길의 차이는 `useSubscribeWithCard` 주석 참고.
  */
  const { data: billingKeys } = useBillingKeys();
  const subscribeWithCard = useSubscribeWithCard();
  const activeCard = findActiveCard(billingKeys);
  const [step, setStep] = useState<PaymentStep>('plan');
  /**
   * 고른 플랜 — **비교표의 칩 하나가 정한다.**
   *
   * 한때 `checkoutId`(결제 대상)와 `comparedId`(표에서 견주는 플랜)로 나눠 뒀다.
   * "훑어보는 것과 사는 건 다르다" 는 이유였는데, 실제로는 둘이 어긋난 채로 결제까지
   * 갈 수 있었다 — 표에 '프로' 를 펴 놓고 위로 올라가 '플러스' 카드 버튼을 누르는 길.
   * 결제 진입점을 표 아래 버튼 하나로 모으면서 선택도 하나로 합쳤다.
   *
   * `null` 이면 가장 비싼 플랜 — 혜택 차이가 가장 크게 보이는 열이다.
   */
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const freePlan = plans.find((p) => p.price === 0);
  const paidPlans = plans.filter((p) => p.price > 0); // 가격 오름차순 (useSubscriptionPlans 가 정렬)
  const selectedPlan =
    paidPlans.find((p) => p.id === selectedId) ?? paidPlans[paidPlans.length - 1];

  /**
   * 지금 이용 중인 플랜의 id. 없으면 `null`.
   *
   * ⚠️ `subscription.plan` 만 보면 안 된다 — 구독한 적 없는 사용자에게도 서버가
   * `plan` 을 채워 준다(무료). `subscriptionId` 가 있어야 실제 구독이다.
   * 해지했어도 만료일까지는 이용 중이라 여기 잡히는 게 맞다 — 그동안 재결제를 막고,
   * 되돌리려면 맨 아래 '자동갱신 다시 켜기' 를 쓰게 한다.
   */
  const currentPlanId = subscription?.subscriptionId ? subscription.plan.id : null;

  /**
   * 등록된 카드로 결제. 앱을 떠나지 않고 `POST /subscriptions` 하나로 끝나므로,
   * 성공 시점이 이 화면에 있다 — 그래서 완료 모달(`complete` 스텝)을 여기서 띄운다.
   * 새 카드로 가는 길에는 그 시점이 없다(페이지가 토스로 떠났다가 다른 URL 로 착지한다).
   */
  const handlePayWithSavedCard = () => {
    if (!selectedPlan || !activeCard) return;
    subscribeWithCard.mutate(
      {
        subscriptionPlanId: selectedPlan.id,
        billingKeyId: activeCard.billingKeyId,
      },
      {
        onSuccess: () => setStep('complete'),
        onError: () =>
          showToast('결제에 실패했어요. 카드 상태를 확인하고 다시 시도해 주세요.', 'error'),
      },
    );
  };

  const handlePayWithNewCard = () => {
    if (!selectedPlan) return;
    // customerKey 발급 → 토스 카드 인증창 → 성공 시 BillingSuccessPage 로 리다이렉트.
    // 빌링키 발급·구독 시작은 그 착지 페이지가 이어받는다(완료 모달은 그쪽 길엔 없다).
    checkout.mutate(selectedPlan.id, {
      /*
        ⚠️ 실패를 화면에 띄운다. 성공하면 페이지가 토스로 떠나므로 '아무 일도 안
        일어남' 이 곧 실패인데, 종전엔 훅의 `console.error` 가 전부라 결제 버튼이
        죽은 것처럼 보였다(`.env` 에 `VITE_TOSS_CLIENT_KEY` 가 없을 때 실제로 그랬다).
        시트는 열어 둔 채로 둔다 — 닫아 버리면 무엇을 사려던 참이었는지도 사라진다.
      */
      onError: () =>
        showToast('결제 창을 열지 못했어요. 잠시 후 다시 시도해 주세요.', 'error'),
    });
  };

  const handleComplete = () => {
    // 프리미엄 여부는 서버(useMySubscription)가 진실이라 로컬 플래그를 세우지 않는다.
    // 방금 산 것을 바로 써 보게 블로그로 보낸다 — 새 카드 길에서도 착지 페이지가 같은 곳으로 간다.
    navigate(ROUTES.blog);
  };

  if (isLoading) {
    return (
      <main className="relative flex min-h-full flex-col">
        <div className={BACKDROP_CLASS} />
        <div className="relative z-10 flex flex-1 flex-col">
          <PremiumNavBar />
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5">
            <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-700" />
            <p className="text-[15px] font-medium text-[#5B6B38]">요금제를 불러오는 중...</p>
          </div>
        </div>
      </main>
    );
  }

  // 요금제를 못 받으면 결제 자체가 불가능하다. 유료 플랜이 하나도 없는 경우도 같은 취급 —
  // 값 없이 카드를 그리면 예전처럼 하드코딩으로 되돌아가게 된다.
  if (isError || !freePlan || paidPlans.length === 0) {
    return (
      <main className="relative flex min-h-full flex-col">
        <div className={BACKDROP_CLASS} />
        <div className="relative z-10 flex flex-1 flex-col">
          <PremiumNavBar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-full pb-nav text-[#2C3930]">
      <div className={BACKDROP_CLASS} />

      {/* 배경 레이어(z-0) 위로 올린다 — 위 BACKDROP_CLASS 주석의 페인트 순서 참고. */}
      {/*
        페이지는 크게 **세 덩어리 + 푸터**다. 여백이 그 경계를 말하게 두고, 값은 두 단만
        쓴다 — **섹션 사이 80px · 섹션 안 48px**. 세 번째 값을 들이면 어느 것이 큰 경계인지
        눈이 못 세고, 그러면 구분선이나 배경색을 덧대게 된다.

        80px 은 네비바 ↔ 히어로 사이와 같은 값이다(참고: 유튜브 프리미엄). 한 페이지에서
        같은 숫자가 되풀이되면 그게 리듬으로 읽힌다.

        ⚠️ 최소 높이(`min-h-screen`)나 스크롤 스냅은 쓰지 않는다. 섹션마다 내용 높이가
        크게 다르고(비교표 ~480px vs 질문 ~300px), 높이를 강제하면 짧은 섹션은 가운데가
        비고 작은 기기에서는 긴 섹션이 잘린다. 여백만으로 한 화면 분량에 맞춘다.
      */}
      <div className="relative z-10">
        <PremiumNavBar />

        {/*
          ① 표지 — 워드마크·헤드라인·혜택 연출이 한 덩어리다.

          셋 다 "무엇이 좋아지는가" 하나만 말하고 값도 선택지도 안 꺼낸다. 혜택을 값보다
          먼저 두는 건 의도한 순서다: 무엇이 좋아지는지 모르는 채 가격표부터 보면 비교할
          기준이 없다(참고한 유튜브 프리미엄도 혜택을 보여준 뒤 요금을 꺼낸다).
        */}
        <section>
          <PremiumHero />
          <div className="mt-12 px-5">
            <BenefitShowcase />
          </div>
        </section>

        {/*
          ② 플랜 비교 및 결제 — 고르고, 견주고, 산다.

          플랜 소개 카드(`PlanIntroCard`)는 지웠다. CTA 를 비교표 아래로 옮기고 나니
          카드에 남은 건 이름·가격·혜택 줄이었는데, 그 셋이 전부 바로 아래 비교표에
          무료와 나란히 다시 나온다 — 같은 값을 두 번 읽히는 자리였다. 비교표 쪽이
          '무료 대비 무엇이 달라지나' 를 같이 답해 주므로 그쪽만 남겼다.
        */}
        <div className="mt-20 px-5">
          <PlanComparison
            freePlan={freePlan}
            paidPlans={paidPlans}
            selectedId={selectedPlan.id}
            onSelect={setSelectedId}
          >
            <PlanCheckoutButton
              plan={selectedPlan}
              isCurrent={selectedPlan.id === currentPlanId}
              onStart={() => setStep('confirm')}
            />
          </PlanComparison>
        </div>

        {/* ③ 질문 — 사기로 마음먹은 뒤 걸리는 것들을 푼다. */}
        <div className="mt-20 px-5">
          <PremiumFaq />
        </div>

        {/*
          푸터 — 파는 자리가 아니라 뒤처리다. 고지·다음 결제일·해지가 여기 모인다.

          해지가 페이지 맨 끝인 이유: 바로 위 고지가 "언제든 해지할 수 있어요" 로 끝나
          그 문장이 곧 이 버튼의 안내가 된다. 구독자가 아니면 아무것도 안 그린다.
        */}
        <footer className="mt-20 px-5">
          {/*
            13px 은 이 페이지에서 가장 작은 단이고 고지에만 쓴다(종전 10px 은 §2 의 최소
            13px 위반이었다). '무료 체험'·'상위 요금제로 변경' 은 근거가 없어 빠졌다 —
            constants/premiumFaq.ts 주석 참고.
          */}
          <p className="text-[13px] leading-relaxed text-[#60655C]">
            결제 후 즉시 저장 용량과 월 작성 횟수가 적용돼요.
            <br />
            매월 자동으로 갱신되고, 다음 결제일 전까지 언제든 해지할 수 있어요.
          </p>

          <SubscriptionCancelSection />
        </footer>
      </div>

      {step === 'confirm' && (
        <PaymentConfirmSheet
          plan={selectedPlan}
          card={activeCard}
          isPending={subscribeWithCard.isPending}
          onCancel={() => setStep('plan')}
          onPay={handlePayWithSavedCard}
          onPayWithNewCard={handlePayWithNewCard}
        />
      )}
      {step === 'complete' && (
        <PaymentCompleteModal plan={selectedPlan} onConfirm={handleComplete} />
      )}
    </main>
  );
}
