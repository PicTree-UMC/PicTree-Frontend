import { useNavigate, useParams } from 'react-router-dom';

import { NavBar, Skeleton } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';

import { usePaymentDetail } from './hooks/usePayments';
import { formatPrice } from './lib/planDisplay';
import { formatPaymentDate, getPaymentDate } from './lib/paymentDisplay';
import type { PaymentDto } from './types/payment';

/** 앱 밖(토스 영수증)으로 나가는 표시. 안쪽 이동의 꺾쇠와 구분한다. */
function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

/**
 * 값 한 줄. **라벨은 고정폭, 값은 남는 폭**이다 — 값이 길어질 때(주문번호) 라벨이
 * 먼저 줄어들면 무슨 값인지 모르는 채로 값만 남는다(`SettingsRow` 와 같은 규칙).
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 border-b border-line-soft px-5 py-3.5 last:border-b-0">
      <span className="w-[84px] shrink-0 text-[15px] text-ink-muted">{label}</span>
      <span className="min-w-0 flex-1 break-all text-right text-[15px] text-ink">{children}</span>
    </div>
  );
}

/**
 * 결제 한 건의 내용.
 *
 * ⚠️ **결제 취소(환불)는 없다.** 서버에는 `POST /payments/{id}/cancel` 이 있고 한때 여기
 * 버튼이 있었지만, 회의에서 "이 화면에는 필요 없다" 고 정리되면서 화면도 배선도 걷었다.
 *
 * 되살릴 일이 생기면 두 가지를 다시 확인할 것:
 *  1. 노출 조건 — 서버 `validateCancelablePayment` 는 `DONE` **이고** `providerPaymentId`
 *     가 있는 건만 받는다. 어긋나면 `PAYMENT409`.
 *  2. **환불은 구독을 끊지 않는다.** 서버가 결제 행 상태만 바꾸므로 환불해도 다음 달
 *     결제는 그대로 나간다(해지는 `/premium` 의 별도 동작이다). 이게 의도인지부터 물을 것.
 */
function DetailBody({ payment }: { payment: PaymentDto }) {
  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      {/*
        금액이 이 화면의 주인공이라 맨 위에 크게 둔다.

        상태 배지는 없다 — 목록이 완료 건만 부르므로(`getMyPayments`) 여기 닿는 결제는
        전부 완료다. 늘 같은 말을 하는 배지는 정보가 아니라 잡음이다.
      */}
      <div className="rounded-xl border border-line-soft bg-white px-5 py-6 text-center">
        <p className="text-[15px] text-ink-muted">{payment.orderName}</p>
        <p className="mt-1.5 text-[28px] font-medium leading-tight text-ink">
          {formatPrice(payment.amount)}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
        <Field label="결제일">{formatPaymentDate(getPaymentDate(payment))}</Field>
        {payment.paymentMethod && <Field label="결제 수단">{payment.paymentMethod}</Field>}
        {/*
          주문번호는 **문의할 때 사용자가 대는 번호**다. 화면에서 쓸 일은 없지만 없으면
          고객센터에서 서로 다른 것을 가리키게 된다.
        */}
        <Field label="주문번호">{payment.orderId}</Field>
      </div>

      {payment.receiptUrl && (
        <a
          href={payment.receiptUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-[46px] items-center justify-center gap-1.5 rounded-xl border border-line-soft bg-white text-[15px] font-medium text-pictree-700 transition active:bg-cream"
        >
          영수증 보기
          <ExternalIcon />
        </a>
      )}
    </div>
  );
}

/** 결제 1건 상세 — 목록에서 줄을 눌러 들어온다. */
export function PaymentDetailPage() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const numericId = Number(paymentId);
  const { data, isPending, isError, refetch } = usePaymentDetail(numericId);

  return (
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      <header className="px-5 pt-header">
        <NavBar onBack={() => navigate(ROUTES.paymentHistory)} title="결제 상세" />
      </header>

      {isError ? (
        <div className="px-5 pt-6">
          <div className="rounded-xl border border-error bg-white px-5 py-4 text-center">
            <p className="text-[15px] text-error">결제 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : isPending ? (
        <div className="flex flex-col gap-4 px-5 pt-6">
          {/* 위 카드와 아래 목록의 높이를 그대로 잡아 둔다 — 값이 들어올 때 자리가 안 튄다. */}
          <div className="rounded-xl border border-line-soft bg-white px-5 py-6">
            <Skeleton surface="card" className="mx-auto h-[15px] w-32" />
            <Skeleton surface="card" className="mx-auto mt-2 h-[28px] w-28" />
            <Skeleton surface="card" className="mx-auto mt-3 h-[20px] w-20 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-line-soft px-5 py-3.5 last:border-b-0"
              >
                <Skeleton surface="card" className="h-[15px] w-16" />
                <Skeleton surface="card" className="h-[15px] w-28" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DetailBody payment={data} />
      )}
    </div>
  );
}
