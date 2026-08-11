import type { PaymentDto } from '../types/payment';

/**
 * 줄에 쓸 날짜.
 *
 * **결제가 끝난 시각(`paidAt`)이 우선이고, 없으면 만든 시각(`createdAt`)이다.** 목록은
 * 완료 건만 부르므로 `paidAt` 이 늘 있지만, 상세는 id 로 직접 열릴 수 있어 방어를 남긴다.
 */
export const getPaymentDate = (payment: PaymentDto): string =>
  payment.paidAt ?? payment.createdAt;

/** `2026-08-09T...` → `2026.08.09`. 목록에서 세로로 훑기 좋게 자릿수를 고정한다. */
export function formatPaymentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}.${month}.${day}`;
}
