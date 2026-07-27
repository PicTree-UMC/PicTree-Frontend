/**
 * 토스페이먼츠 SDK 래퍼 — 프론트가 토스와 직접 통신하는 "유일한" 지점.
 *
 * 여기서 하는 일은 카드 인증창을 띄우는 것뿐이다. 실제 빌링키 발급·정기 청구는
 * 백엔드가 시크릿 키로 처리한다(프론트엔 클라이언트 키만 둔다).
 *
 * requestBillingAuth 는 성공 시 successUrl 로 리다이렉트하며, 쿼리스트링에
 * `authKey` 와 `customerKey` 를 붙여준다. 그 값을 착지 페이지에서 백엔드
 * (POST /billing-keys)로 넘긴다. → BillingSuccessPage 참조.
 */

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { ROUTES } from '@/shared/constants/routes';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;

/**
 * 리다이렉트로 선택 플랜 상태가 날아가므로, 인증창을 열기 직전에 sessionStorage 에
 * 담아두고 BillingSuccessPage 에서 읽어 구독 시작에 쓴다.
 */
export const PENDING_PLAN_STORAGE_KEY = 'pictree.pendingPlan';

/**
 * 카드 자동결제(빌링) 인증창을 띄운다.
 * 성공하면 이 함수는 반환하지 않고 successUrl 로 페이지가 이동한다.
 */
export async function requestBillingAuth(customerKey: string): Promise<void> {
  if (!clientKey) {
    // .env 에 VITE_TOSS_CLIENT_KEY 가 없으면 여기서 명확히 멈춘다.
    throw new Error('VITE_TOSS_CLIENT_KEY 가 설정되지 않았습니다 (.env 확인).');
  }

  const tossPayments = await loadTossPayments(clientKey);
  const payment = tossPayments.payment({ customerKey });

  await payment.requestBillingAuth({
    method: 'CARD',
    successUrl: `${window.location.origin}${ROUTES.premiumBillingSuccess}`,
    failUrl: `${window.location.origin}${ROUTES.premiumBillingFail}`,
    // customerName / customerEmail 은 선택. 회원 정보 연동되면 채운다.
  });
}
