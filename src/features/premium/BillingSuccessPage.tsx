import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { registerBillingKey, startSubscription } from './api/paymentApi';
import { PENDING_PLAN_STORAGE_KEY } from './lib/tossPayments';

/**
 * 토스 빌링 인증 성공 후 착지하는 페이지.
 * 토스가 쿼리스트링에 붙여준 authKey·customerKey 를 백엔드로 넘겨
 * 빌링키 발급 → 구독 시작까지 이어서 처리한다.
 *
 * 청구할 요금제는 sessionStorage 의 서버 요금제 id 를 그대로 쓴다(PremiumPage 가 저장).
 */
export function BillingSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const ranRef = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const storedPlanId = Number(sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY));

    // 요금제 id 가 없으면(세션 유실·직접 진입) 여기서 멈춘다. 예전엔 최상위 플랜으로
    // 넘어가 있었는데, 그건 고르지도 않은 요금제를 청구하는 것이라 더 나쁘다.
    if (!authKey || !customerKey || !Number.isInteger(storedPlanId) || storedPlanId <= 0) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        // 1) authKey → 빌링키 발급. 응답의 billingKeyId 를 구독 시작에 넘긴다.
        const billingKey = await registerBillingKey({ authKey, customerKey });
        // 2) 구독 시작. GET /subscription-plans 의 id 를 그대로 넘긴다.
        await startSubscription({
          subscriptionPlanId: storedPlanId,
          billingKeyId: billingKey.billingKeyId,
        });
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
        // TODO: 완료 화면(PaymentCompleteModal)로 전환하거나 구독 상태를 무효화 후 이동
        navigate(ROUTES.blog, { replace: true });
      } catch (err) {
        // 화면엔 "결제 확인 실패" 한 줄만 뜨므로, 어느 단계(POST /billing-keys vs
        // /subscriptions)에서 뭐가 터졌는지는 이 로그가 유일한 단서다. 삼키지 않는다.
        console.error('[billing-success] 빌링키/구독 시작 실패:', err);
        setStatus('error');
      }
    })();
  }, [navigate, searchParams]);

  return (
    <main className="flex min-h-full w-full flex-col items-center justify-center gap-4 px-5 text-center text-[#20251f]">
      {status === 'processing' ? (
        <p className="text-[15px]">결제를 확인하고 있어요…</p>
      ) : (
        <>
          <p className="text-[15px]">결제 확인에 실패했어요.</p>
          <button
            className="h-[45px] rounded-xl bg-[#879b54] px-6 font-bold text-white"
            onClick={() => navigate(ROUTES.premium, { replace: true })}
          >
            다시 시도
          </button>
        </>
      )}
    </main>
  );
}
