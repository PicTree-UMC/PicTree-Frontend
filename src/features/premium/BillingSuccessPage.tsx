import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/shared/constants/routes';
import { registerBillingKey, startSubscription } from './api/paymentApi';
import { paymentKeys } from './hooks/useMySubscription';
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
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
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

        // TODO: 완료 화면(PaymentCompleteModal)로 전환 — 지금은 블로그로 바로 보낸다
        navigate(ROUTES.blog, { replace: true });
      } catch (err) {
        // 화면엔 "결제 확인 실패" 한 줄만 뜨므로, 어느 단계(POST /billing-keys vs
        // /subscriptions)에서 뭐가 터졌는지는 이 로그가 유일한 단서다. 삼키지 않는다.
        console.error('[billing-success] 빌링키/구독 시작 실패:', err);
        setStatus('error');
      }
    })();
  }, [navigate, searchParams, queryClient]);

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
