import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { registerBillingKey, startSubscription } from './api/paymentApi';
import { PENDING_PLAN_STORAGE_KEY } from './lib/tossPayments';
import type { SubscriptionPlan } from './types/premium';

/**
 * 토스 빌링 인증 성공 후 착지하는 페이지.
 * 토스가 쿼리스트링에 붙여준 authKey·customerKey 를 백엔드로 넘겨
 * 빌링키 발급 → 구독 시작까지 이어서 처리한다.
 *
 * ⚠️ startSubscription 이 넘길 planId 는 백엔드 스펙 확정 후 매핑한다.
 *    지금은 sessionStorage 의 로컬 플랜('monthly'/'annual')을 그대로 전달한다.
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
    const plan = sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) as SubscriptionPlan | null;

    if (!authKey || !customerKey) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        // 1) authKey → 빌링키 발급. 응답의 billingKeyId 를 구독 시작에 넘긴다.
        const billingKey = await registerBillingKey({ authKey, customerKey });
        // 2) 구독 시작. subscriptionPlanId 는 숫자 요금제 id.
        // TODO: 선택 플랜(plan)을 실제 요금제 id 로 매핑 — GET /subscription-plans 의 id.
        //   요금제 미등록(data:[]) + plus/pro/max↔백엔드 구조 미합의라 아래는 임시 매핑.
        const TEMP_PLAN_ID: Record<SubscriptionPlan, number> = { plus: 1, pro: 2, max: 3 };
        await startSubscription({
          subscriptionPlanId: TEMP_PLAN_ID[plan ?? 'max'],
          billingKeyId: billingKey.billingKeyId,
        });
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
        // TODO: 완료 화면(PaymentCompleteModal)로 전환하거나 구독 상태를 무효화 후 이동
        navigate(ROUTES.blog, { replace: true });
      } catch {
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
