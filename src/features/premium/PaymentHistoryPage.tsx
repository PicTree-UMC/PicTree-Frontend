import { useNavigate } from 'react-router-dom';

import { NavBar, Skeleton } from '@/shared/components';
import { ROUTES, paymentDetailPath } from '@/shared/constants/routes';

import { usePayments } from './hooks/usePayments';
import { formatPrice } from './lib/planDisplay';
import { formatPaymentDate, getPaymentDate } from './lib/paymentDisplay';
import type { PaymentDto } from './types/payment';

/** 상세로 들어가는 꺾쇠. 앱 안에서 이동하므로 대각선이 아니다. */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-1 size-4 shrink-0 text-ink-disabled"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/**
 * 결제 한 건. **줄 전체가 상세로 가는 버튼이다.**
 *
 * ⚠️ **영수증 링크를 여기서 뺐다.** 줄이 눌리게 되면서 링크가 버튼 안의 버튼이 됐고,
 * 34px 짜리 목표 둘이 겹치면 모바일에서 어느 쪽이 눌릴지 손가락이 정한다. 영수증은
 * 상세로 옮겼다 — 거기서는 자기 자리를 갖는다.
 */
function PaymentRow({ payment, onOpen }: { payment: PaymentDto; onOpen: () => void }) {
  return (
    <li className="border-b border-line-soft last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition active:bg-cream"
      >
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

        </div>

        {/*
          ⚠️ **상태 배지를 두지 않는다.** 목록이 완료 건만 부르므로(`getMyPayments`) 모든 줄이
          같은 말을 하게 되고, 줄마다 붙은 같은 배지는 정보가 아니라 잡음이다. 대기·실패·취소를
          다시 보여주게 되면 그때 배지가 다시 뜻을 갖는다.
        */}
        <span className="shrink-0 text-[15px] font-medium text-ink">
          {formatPrice(payment.amount)}
        </span>

        <ChevronIcon />
      </button>
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
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePayments();

  // 받아 둔 페이지를 한 줄로 편다. `items` 는 `null` 로 올 수 있다.
  const payments = data?.pages.flatMap((page) => page.items ?? []) ?? [];

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
                {/* 배지가 없어졌으므로 골격도 금액 한 줄뿐이다 — 골격이 실제보다 크면 자리가 튄다. */}
                <Skeleton surface="card" className="h-[15px] w-16 shrink-0" />
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
          <>
            <ul className="overflow-hidden rounded-xl border border-line-soft bg-white">
              {payments.map((payment) => (
                <PaymentRow
                  key={payment.paymentId}
                  payment={payment}
                  onOpen={() => navigate(paymentDetailPath(payment.paymentId))}
                />
              ))}
            </ul>

            {/*
              다음 페이지가 있을 때만 그린다. 무한 스크롤이 아니라 버튼이다 — 결제 내역은
              끝까지 훑는 화면이 아니라 특정 건을 찾으러 오는 화면이라, 스크롤이 저절로
              늘어나면 바닥(=가장 오래된 결제)에 닿을 방법이 없어진다.
            */}
            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="h-[46px] w-full rounded-xl border border-line-soft bg-white text-[15px] font-medium text-ink-muted transition active:bg-cream disabled:opacity-60"
              >
                {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
