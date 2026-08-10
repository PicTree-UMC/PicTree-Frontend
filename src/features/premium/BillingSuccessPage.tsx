import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/shared/constants/routes';
import { registerBillingKey, startSubscription } from './api/paymentApi';
import { paymentKeys } from './hooks/useMySubscription';
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans';
import { PaymentCompleteModal } from './components/PaymentCompleteModal';
import {
  BILLING_INTENT_STORAGE_KEY,
  PENDING_PLAN_STORAGE_KEY,
  type BillingIntent,
} from './lib/tossPayments';

/**
 * 토스 빌링 인증 성공 후 착지하는 페이지.
 * 토스가 쿼리스트링에 붙여준 authKey·customerKey 를 백엔드로 넘겨 빌링키를 발급한다.
 *
 * **두 흐름이 같은 URL 로 돌아온다** — 인증창을 연 이유를 sessionStorage 의
 * `BILLING_INTENT_STORAGE_KEY` 로 구분한다(`tossPayments.ts` 참고).
 * - `subscribe`   → 빌링키 발급 + 구독 시작. 요금제는 저장해 둔 서버 id 를 그대로 쓴다.
 * - `register-card` → 빌링키 발급까지만. 결제 수단 관리 화면으로 돌려보낸다.
 */
export function BillingSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'processing' | 'complete' | 'error'>('processing');
  /**
   * 결제가 끝난 요금제. 완료 모달이 용량·생성 횟수·광고 제거를 여기서 읽는다.
   *
   * **id 만 들고 있다가 렌더에서 목록과 맞춘다.** 착지 시점에 아는 건 sessionStorage 의
   * id 뿐이고(토스는 요금제를 모른다), 모달은 `SubscriptionPlanDto` 전체를 받기 때문이다.
   */
  const [completedPlanId, setCompletedPlanId] = useState<number | null>(null);
  /*
    토스에서 돌아오는 길은 **전체 페이지 이동**이라 react-query 캐시가 비어 있다.
    그래서 이 조회는 요금제를 고를 때 이미 받아온 적이 있어도 여기서 한 번 더 나간다.
  */
  const { data: plans, isPending: isPlansPending } = useSubscriptionPlans();
  /**
   * 카드만 등록하러 온 흐름인가. 실패 화면의 문구와 '다시 시도' 가 돌아갈 자리를 가른다 —
   * 카드를 바꾸러 온 사람에게 "결제 확인에 실패했어요" 라고 하고 요금제 고르는 화면으로
   * 보내면, 하려던 일과 아무 상관 없는 답을 받는다.
   *
   * effect 안에서 읽은 의도를 그대로 들고 있는다 — 렌더 시점에 sessionStorage 를 다시
   * 읽으면 성공 경로에서 이미 지운 뒤라 값이 없다.
   */
  const [isRegisterOnly, setIsRegisterOnly] = useState(false);
  const ranRef = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const intent = sessionStorage.getItem(BILLING_INTENT_STORAGE_KEY) as BillingIntent | null;
    const storedPlanId = Number(sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY));

    if (!authKey || !customerKey) {
      setStatus('error');
      return;
    }

    /*
      구독 결제인데 요금제 id 가 없으면(세션 유실) 여기서 멈춘다. 예전엔 최상위 플랜으로
      넘어가 있었는데, 그건 고르지도 않은 요금제를 청구하는 것이라 더 나쁘다.
      의도를 못 읽은 경우(`intent === null`, 직접 진입)도 같은 취급 — 뭘 하려던 건지
      모르는 채로 카드를 등록하거나 구독을 시작하지 않는다.
    */
    const registerOnly = intent === 'register-card';
    setIsRegisterOnly(registerOnly);

    if (!registerOnly && (!Number.isInteger(storedPlanId) || storedPlanId <= 0)) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        // authKey → 빌링키 발급. 두 흐름 모두 여기까지는 같다.
        const billingKey = await registerBillingKey({ authKey, customerKey });
        sessionStorage.removeItem(BILLING_INTENT_STORAGE_KEY);

        if (registerOnly) {
          // 카드만 등록하러 온 경우. 구독은 건드리지 않으므로 카드 목록만 무효화한다.
          await queryClient.invalidateQueries({ queryKey: paymentKeys.billingKeys });
          navigate(ROUTES.paymentMethods, { replace: true });
          return;
        }

        // 구독 시작. GET /subscription-plans 의 id 를 그대로 넘긴다.
        await startSubscription({
          subscriptionPlanId: storedPlanId,
          billingKeyId: billingKey.billingKeyId,
        });
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);

        /*
         * 방금 바뀐 두 가지를 무효화한다 — 구독이 생겼고(me), 카드가 등록됐다(billingKeys).
         *
         * 이게 없으면 결제 직후 구독 관리 화면이 "이용 중인 구독이 없어요" 로 보인다.
         * staleTime 이 60초라(shared/lib/queryClient.ts) 결제 전에 그 화면을 한 번이라도
         * 열었으면 그때 캐시된 null 이 그대로 나온다. 하필 업그레이드 버튼이 그 화면에
         * 있어서 가장 흔한 경로가 정확히 이 순서다: 구독 관리 → 업그레이드 → 결제 → 복귀.
         *
         * 취소·재개(useSubscriptionActions)는 원래 이걸 하고 있었다. 구독 시작만 빠져 있었다.
         */
        await queryClient.invalidateQueries({ queryKey: paymentKeys.me });
        await queryClient.invalidateQueries({ queryKey: paymentKeys.billingKeys });

        /*
          완료 모달을 띄운다. 예전엔 여기서 곧장 블로그로 보냈는데, 그러면 **첫 결제한
          사람만 확인 화면을 못 본다** — 등록 카드가 없으니 첫 결제는 반드시 이 길로 오고,
          앱 안에서 끝나는 길(PremiumPage 의 complete 스텝)에만 모달이 붙어 있었다.
          돈이 빠져나갔는데 아무 말이 없으면 실패로 읽고 다시 결제한다.

          목적지는 그대로 블로그다 — 확인을 한 겹 얹은 것이지 흐름을 바꾼 게 아니다.
          두 길의 끝점이 같아야 한다(PremiumPage 의 handleComplete 와 같은 곳).
        */
        setCompletedPlanId(storedPlanId);
        setStatus('complete');
      } catch (err) {
        // 화면엔 "결제 확인 실패" 한 줄만 뜨므로, 어느 단계(POST /billing-keys vs
        // /subscriptions)에서 뭐가 터졌는지는 이 로그가 유일한 단서다. 삼키지 않는다.
        console.error('[billing-success] 빌링키/구독 시작 실패:', err);
        setStatus('error');
      }
    })();
  }, [navigate, searchParams, queryClient]);

  const completedPlan = plans?.find((plan) => plan.id === completedPlanId) ?? null;

  /*
    요금제를 못 찾으면 **막지 말고 보낸다.** 결제는 이미 성공했고 서버에도 반영됐다 —
    확인 화면을 못 그린다는 이유로 사용자를 빈 화면에 세워두면, 성공한 결제가 실패처럼
    보인다. 목록 조회가 실패했거나 id 가 목록에 없는 경우가 여기 해당한다.

    ⚠️ `isPending` 동안에는 아무것도 하지 않는다 — 아직 "못 찾은" 게 아니라 "모르는" 것이다.
    이걸 안 가르면 조회가 끝나기 전에 블로그로 튕겨 모달이 영영 안 보인다.
  */
  useEffect(() => {
    if (status !== 'complete' || completedPlan || isPlansPending) return;
    navigate(ROUTES.blog, { replace: true });
  }, [status, completedPlan, isPlansPending, navigate]);

  if (status === 'complete') {
    // 조회 중이면 로딩 문구를 유지한다. 결제는 끝났고 화면에 그릴 값만 기다리는 중이다.
    return completedPlan ? (
      <PaymentCompleteModal
        plan={completedPlan}
        onConfirm={() => navigate(ROUTES.blog, { replace: true })}
      />
    ) : (
      <main className="flex min-h-full w-full flex-col items-center justify-center px-5 text-center text-ink">
        <p className="text-[15px]">결제를 확인하고 있어요…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-full w-full flex-col items-center justify-center gap-4 px-5 text-center text-ink">
      {status === 'processing' ? (
        <p className="text-[15px]">
          {isRegisterOnly ? '카드를 등록하고 있어요…' : '결제를 확인하고 있어요…'}
        </p>
      ) : (
        <>
          <p className="text-[15px]">
            {isRegisterOnly ? '카드 등록에 실패했어요.' : '결제 확인에 실패했어요.'}
          </p>
          <button
            className="h-[45px] rounded-xl bg-pictree-700 px-6 font-medium text-white"
            onClick={() =>
              navigate(isRegisterOnly ? ROUTES.paymentMethods : ROUTES.premium, {
                replace: true,
              })
            }
          >
            다시 시도
          </button>
        </>
      )}
    </main>
  );
}
