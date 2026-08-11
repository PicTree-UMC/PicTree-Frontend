import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DeleteConfirmModal, NavBar, Skeleton, useToast } from '@/shared/components';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import { ROUTES } from '@/shared/constants/routes';

import { usePaymentDetail, useCancelPayment } from './hooks/usePayments';
import { formatPrice } from './lib/planDisplay';
import { formatPaymentDate, getPaymentDate, getPaymentStatusBadge } from './lib/paymentDisplay';
import { canCancelPayment, type PaymentDto } from './types/payment';

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

function DetailBody({ payment }: { payment: PaymentDto }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cancel = useCancelPayment();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const badge = getPaymentStatusBadge(payment.status);
  const cancelable = canCancelPayment(payment);

  const handleCancel = () => {
    cancel.mutate(payment.paymentId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        showToast('결제를 취소했어요.', 'success');
      },
      onError: (error) => {
        setIsConfirmOpen(false);
        /*
          서버 문구를 그대로 든다. 취소 실패는 사유가 갈린다 — 이미 취소된 건, 취소할 수
          없는 상태(`PAYMENT409`), 결제사 통신 실패(`PAYMENT502`). 우리가 지어낸 한 문장으로
          덮으면 사용자도 우리도 무엇이 막았는지 못 본다.
        */
        showToast(
          getApiErrorMessage(error, '결제를 취소하지 못했어요. 잠시 후 다시 시도해 주세요.'),
          'error',
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      {/* 금액과 상태가 이 화면의 주인공이라 맨 위에 크게 둔다. */}
      <div className="rounded-xl border border-line-soft bg-white px-5 py-6 text-center">
        <p className="text-[15px] text-ink-muted">{payment.orderName}</p>
        <p className="mt-1.5 text-[28px] font-medium leading-tight text-ink">
          {formatPrice(payment.amount)}
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-2.5 py-[3px] text-[13px] font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
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

      {/*
        ⚠️ **취소는 목록이 아니라 여기 있다.** 목록에 두면 내역을 훑다가 누르는 사고가 난다 —
        상세까지 들어온 것은 그 건 하나를 보러 온 것이다.

        조건은 서버와 같다(`canCancelPayment`). 못 하는 건에는 버튼을 아예 안 그린다 —
        눌러 본 뒤에 안 된다고 말하는 것과 처음부터 없는 것은 다르다.
      */}
      {cancelable && (
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="h-[46px] w-full rounded-xl border border-error/40 bg-white text-[15px] font-medium text-error transition active:bg-error-surface"
        >
          결제 취소
        </button>
      )}

      {/*
        앱의 파괴적 확인은 전부 이 공용 모달을 쓴다(`DeleteConfirmModal`) — 삭제·탈퇴와
        같은 생김새·같은 버튼 순서여야 "무서운 쪽" 이 어디인지 화면마다 다시 배우지 않는다.
      */}
      <DeleteConfirmModal
        isOpen={isConfirmOpen}
        title="이 결제를 취소할까요?"
        /*
          ⚠️ **"구독이 끊긴다" 고 말하면 안 된다.** 서버는 결제 행의 상태만 바꾸고 구독은
          그대로 둔다(`cancelPayment` 주석). 환불과 해지는 다른 동작이라 갈 곳도 다르다.

          ⚠️ **문구에 `—`(em dash)를 쓰지 않는다.** 앱 폰트에 그 글리프가 없어서 화면에는
          빈칸으로 나온다(실제로 그렇게 떴다). 주석에는 써도 되지만 사용자에게 보이는
          문자열에는 마침표로 끊는다.
        */
        description={
          <>
            {formatPrice(payment.amount)}이 결제 수단으로 환불돼요.
            <br />
            이용 중인 구독은 그대로예요.
          </>
        }
        /*
          ⚠️ **`결제 취소` 가 아니라 `환불하기` 다.** 이 모달의 닫기 버튼은 글자가 `취소` 로
          고정돼 있어서(공용 컴포넌트), 확인까지 `결제 취소` 로 두면 **버튼 둘 다 '취소'** 가
          된다 — 하나는 모달을 닫고 하나는 돈을 되돌리는데 글자로 못 가른다.
          하는 일을 그대로 부르면 겹치지 않는다(돈이 돌아온다 = 환불).
        */
        confirmLabel="환불하기"
        pendingLabel="환불 중"
        isDeleting={cancel.isPending}
        onConfirm={handleCancel}
        onClose={() => setIsConfirmOpen(false)}
      />

      {/* 취소한 건은 더 할 일이 없다 — 목록으로 돌아가는 길만 남긴다. */}
      {!cancelable && payment.status !== 'DONE' && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.paymentHistory)}
          className="h-[46px] w-full rounded-xl border border-line-soft bg-white text-[15px] font-medium text-ink-muted transition active:bg-cream"
        >
          목록으로
        </button>
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
