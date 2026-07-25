import type { SubscriptionPlan } from '../types/premium';
import { PLAN_DETAILS } from '../types/premium';
import { ModalShell } from './ModalShell';

type Props = { plan: SubscriptionPlan; onCancel: () => void; onPay: () => void };

export function PaymentConfirmSheet({ plan, onCancel, onPay }: Props) {
  const details = PLAN_DETAILS[plan];
  return (
    <ModalShell bottom>
      <h2 className="text-center text-[21px] font-bold">결제 확인</h2>
      <div className="mt-4 overflow-hidden rounded-xl border-2 border-[#bed793] bg-white text-[13px]">
        <div className="grid grid-cols-[90px_1fr] gap-y-5 px-7 py-4"><span>상품명</span><span className="text-right">{details.name} · {details.storage}</span><span>AI 블로그</span><span className="text-right">{details.generations}</span><span>무료 체험</span><span className="text-right">3일</span></div>
        <div className="flex justify-between border-t border-[#d8e5bf] px-7 py-3"><span>결제 금액</span><span>{details.price}</span></div>
      </div>
      <p className="mt-4 text-center text-[10px] leading-5">매월 자동으로 갱신돼요<br/>다음 결제일 전까지 언제든 해지할 수 있어요</p>
      <button className="mt-7 h-[62px] w-full rounded-xl bg-[#879b54] font-bold text-white shadow-lg" onClick={onPay}>결제하기</button>
      <button className="mt-3 h-[45px] w-full rounded-xl bg-[#c4cdb0] font-bold text-white" onClick={onCancel}>취소</button>
    </ModalShell>
  );
}
