import { useNavigate } from 'react-router-dom';

import { NavBar, Skeleton } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';

import { usePayments } from './hooks/usePayments';
import { formatPrice } from './lib/planDisplay';
import {
  formatPaymentDate,
  getPaymentDate,
  getPaymentStatusBadge,
  isRefunded,
} from './lib/paymentDisplay';
import type { PaymentDto } from './types/payment';

/** 영수증으로 나가는 화살표. 앱 밖으로 나간다는 뜻이라 꺾쇠가 아니라 대각선이다. */
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
 * 결제 한 건.
 *
 * **누르는 줄이 아니다.** 상세 화면(`GET /payments/{id}`)이 서버엔 있지만, 목록이 이미
 * 영수증 URL까지 들고 와서 더 보여줄 것이 없다 — 눌러도 같은 값만 나오는 문을 만들면
 * 사용자는 한 번 눌러 보고 다시 안 누른다. 대신 **영수증만 밖으로 나가는 링크**로 둔다.
 */
function PaymentRow({ payment }: { payment: PaymentDto }) {
  const badge = getPaymentStatusBadge(payment.status);
  const refunded = isRefunded(payment.status);

  return (
    <li className="border-b border-line-soft last:border-b-0">
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink">{payment.orderName}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] text-ink-muted">
              {formatPaymentDate(getPaymentDate(payment))}
            </span>
            {/* 결제 수단은 서버가 토스에서 받은 값을 그대로 준다 — 없을 수 있다. */}
            {payment.paymentMethod && (
              <>
                <span aria-hidden className="text-[13px] text-line">·</span>
                <span className="text-[13px] text-ink-muted">{payment.paymentMethod}</span>
              </>
            )}
          </div>

          {/*
            영수증은 결제가 실제로 끝난 건에만 있다. 없는 줄에 빈 자리를 두지 않는다 —
            줄 높이가 들쭉날쭉해지는 것보다 링크가 있는 줄만 한 줄 긴 편이 읽기 쉽다.
          */}
          {payment.receiptUrl && (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-pictree-700 underline underline-offset-4"
            >
              영수증 보기
              <ExternalIcon />
            </a>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {/*
            취소·실패 건은 금액에 취소선을 긋는다 — 숫자만 두면 빠져나간 돈으로 읽힌다
            (`isRefunded` 주석). 배지가 이미 말하지만 금액이 먼저 눈에 든다.
          */}
          <span
            className={`text-[15px] font-medium ${
              refunded ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {formatPrice(payment.amount)}
          </span>
          <span className={`rounded-full px-2 py-[1px] text-[13px] font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * 결제 내역 — 내 정보 → 결제 수단 아래에서 들어온다.
 *
 * **읽는 화면이다.** 서버에는 결제 취소(`POST /payments/{id}/cancel`)도 있지만 붙이지
 * 않았다 — 환불은 정책·확인 절차가 따라붙는 별건이고, 여기에 두면 내역을 훑다가 누르는
 * 사고가 난다.
 *
 * 첫 페이지(최대 100건)만 받는다. 더보기는 결제가 그만큼 쌓인 뒤에 붙인다
 * (`getMyPayments` 주석).
 */
export function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = usePayments();

  const payments = data?.items ?? [];

  return (
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      <header className="px-5 pt-header">
        <NavBar onBack={() => navigate(ROUTES.profileEdit)} title="결제 내역" />
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
        {isError ? (
          <div className="rounded-xl border border-error bg-white px-5 py-4 text-center">
            <p className="text-[15px] text-error">결제 내역을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : isPending ? (
          /* 줄 세 개 높이. 카드 껍데기까지 미리 그려 목록이 들어올 때 자리가 안 튄다. */
          <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-line-soft px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton surface="card" className="h-[15px] w-40" />
                  <Skeleton surface="card" className="mt-2 h-[13px] w-28" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Skeleton surface="card" className="h-[15px] w-16" />
                  <Skeleton surface="card" className="h-[18px] w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-line-soft bg-white px-5 py-8 text-center">
            <p className="text-[15px] text-ink">아직 결제 내역이 없어요.</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              프리미엄을 시작하면 결제 기록이 여기 쌓여요.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line-soft bg-white">
            {payments.map((payment) => (
              <PaymentRow key={payment.paymentId} payment={payment} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
