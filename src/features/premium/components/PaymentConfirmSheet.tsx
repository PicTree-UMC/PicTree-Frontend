import { planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';
import { ModalShell } from './ModalShell';

type Props = { plan: SubscriptionPlanDto; onCancel: () => void; onPay: () => void };

export function PaymentConfirmSheet({ plan, onCancel, onPay }: Props) {
  const details = planSummary(plan);
  // 손잡이를 끌어 닫는 건 '취소' 와 같다 — 결제는 아무것도 진행되지 않는다.
  return (
    <ModalShell bottom onClose={onCancel}>
      <h2 className="text-center text-[21px] font-bold">결제 확인</h2>
      <div className="mt-4 overflow-hidden rounded-xl border-2 border-pictree-300 bg-white text-[13px]">
        {/*
          ⚠️ '무료 체험 3일' 은 근거 없는 값이다 (2026-07-31 확인).
          시안에서 옮겨온 문구인데 이를 뒷받침하는 데이터가 어디에도 없다 —
          `GET /subscription-plans` 응답에 체험 관련 필드가 없고(id·code·name·price·
          billingCycle·description·features[] 가 전부), 스웨거에도 trial 계열 스키마가
          없다. 소스 전체에서 '무료 체험' 은 이 줄이 유일하다.

          하필 `결제하기` 직전 화면이라 사실이 아니면 "3일은 공짜"로 읽고 결제하게 된다.
          판정법: 구독을 한 번 성사시키고 `POST /subscriptions` 응답의 nextBillingAt 을
          본다. 3일 뒤면 체험이 있는 것이고, 한 달 뒤면 없는 것이니 이 줄을 지운다.
          → HANDOFF 0절 참조.
        */}
        <div className="grid grid-cols-[90px_1fr] gap-y-5 px-7 py-4"><span>상품명</span><span className="text-right">{details.name} · {details.storage}</span><span>AI 블로그</span><span className="text-right">{details.generations}</span><span>무료 체험</span><span className="text-right">3일</span></div>
        <div className="flex justify-between border-t border-pictree-100 px-7 py-3"><span>결제 금액</span><span>{details.price}</span></div>
      </div>
      <p className="mt-4 text-center text-[10px] leading-5">매월 자동으로 갱신돼요<br/>다음 결제일 전까지 언제든 해지할 수 있어요</p>
      <button className="mt-7 h-[62px] w-full rounded-xl bg-pictree-700 font-bold text-white shadow-lg" onClick={onPay}>결제하기</button>
      <button className="mt-3 h-[45px] w-full rounded-xl bg-pictree-100 font-bold text-pictree-700" onClick={onCancel}>취소</button>
    </ModalShell>
  );
}
