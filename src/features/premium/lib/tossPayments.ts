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
 * 이 인증창을 **왜** 열었는지. 착지 페이지가 그 다음에 뭘 할지를 이 값으로 가른다.
 *
 * 토스 인증창은 두 경로에서 똑같이 열린다 — 구독 결제와 카드만 등록하기. 돌아오는
 * successUrl 도 같아서, 착지 페이지는 쿼리스트링만 보고는 둘을 구분할 수 없다.
 *
 * ⚠️ **'플랜 id 가 없으면 카드 등록' 으로 때우면 안 된다.** 결제 도중 세션이 유실돼
 * 플랜 id 가 날아간 경우와 구분이 안 돼서, 구독하려던 사람의 카드만 조용히 등록해
 * 놓고 결제는 안 된 채로 끝난다. 의도를 따로 적어 두면 그 경우는 지금처럼 오류로 잡힌다.
 */
export const BILLING_INTENT_STORAGE_KEY = 'pictree.billingIntent';

export type BillingIntent = 'subscribe' | 'register-card';

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
