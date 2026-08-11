import { PAYMENT_STATUS, type PaymentDto } from '../types/payment';

/** 상태 배지의 말과 톤. */
export interface PaymentStatusBadge {
  label: string;
  /** 배지에 얹을 클래스. 토스트 배지와 같은 어휘를 쓴다(옅은 면 + 진한 글자). */
  className: string;
}

/**
 * 결제 상태 → 배지.
 *
 * ⚠️ **모르는 상태를 지어내지 않는다.** 서버가 토스 상태를 넓히면 프론트는 먼저 알 길이
 * 없어서, 여기 없는 값은 `status` 원문을 그대로 보여준다 — '완료' 로 뭉뚱그리면 실패한
 * 결제가 성공으로 읽히고, 그건 돈 문제에서 가장 위험한 방향이다.
 *
 * `READY`·`WAITING_FOR_DEPOSIT` 은 **아직 안 끝난 건**이라 성공(초록)으로 칠하지 않는다.
 */
export function getPaymentStatusBadge(status: string): PaymentStatusBadge {
  switch (status) {
    case PAYMENT_STATUS.done:
      return { label: '결제 완료', className: 'bg-pictree-100 text-pictree-700' };
    case PAYMENT_STATUS.canceled:
      return { label: '결제 취소', className: 'bg-line-soft text-ink-muted' };
    case PAYMENT_STATUS.failed:
      return { label: '결제 실패', className: 'bg-error-surface text-error' };
    case PAYMENT_STATUS.ready:
      return { label: '결제 대기', className: 'bg-cream-sub text-ink-muted' };
    case PAYMENT_STATUS.waitingForDeposit:
      return { label: '입금 대기', className: 'bg-cream-sub text-ink-muted' };
    default:
      return { label: status, className: 'bg-cream-sub text-ink-muted' };
  }
}

/**
 * 줄에 쓸 날짜.
 *
 * **결제가 끝난 시각(`paidAt`)이 우선이고, 없으면 만든 시각(`createdAt`)이다.** 실패·대기
 * 건은 `paidAt` 이 비어 있는데, 그렇다고 날짜를 안 보여주면 목록에서 순서를 읽을 단서가
 * 사라진다.
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

/**
 * 취소된 결제의 금액에는 취소선을 긋는다 — 숫자만 두면 **빠져나간 돈으로 읽힌다.**
 * 상태 배지가 이미 말하지만, 금액은 목록에서 가장 먼저 눈에 드는 값이라 거기서도 말한다.
 */
export const isRefunded = (status: string): boolean =>
  status === PAYMENT_STATUS.canceled || status === PAYMENT_STATUS.failed;
