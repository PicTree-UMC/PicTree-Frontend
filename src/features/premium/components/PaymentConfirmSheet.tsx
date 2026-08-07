import { planSummary } from '../lib/planDisplay';
import type { BillingKeyDto, SubscriptionPlanDto } from '../types/payment';
import { ModalShell } from './ModalShell';

type Props = {
  plan: SubscriptionPlanDto;
  /**
   * 재사용할 등록 카드. `null`/`undefined` 면 결제할 카드가 없다는 뜻이고, 이때는
   * 토스 인증창을 여는 길만 남는다.
   */
  card?: BillingKeyDto | null;
  /** 등록 카드로 결제하는 중(`POST /subscriptions` 대기). 새 카드 길은 페이지가 떠나므로 해당 없다. */
  isPending?: boolean;
  onCancel: () => void;
  /** 등록 카드로 바로 결제. `card` 가 있을 때만 불린다. */
  onPay: () => void;
  /** 토스 인증창을 열어 새 카드로 결제. */
  onPayWithNewCard: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <span className="shrink-0 text-[15px] text-[#60655C]">{label}</span>
      <span className="text-right text-[15px] font-medium text-[#2C3930]">{value}</span>
    </div>
  );
}

/**
 * 결제 직전 확인 시트.
 *
 * **등록된 카드가 있으면 그 카드로 결제한다** — 앱을 떠나지 않고 `POST /subscriptions`
 * 하나로 끝난다. 종전엔 카드가 있든 없든 무조건 토스 인증창을 열어서, 카드를 등록해 둔
 * 사람도 결제할 때마다 카드번호를 다시 넣어야 했다(`useSubscribeWithCard` 주석 참고).
 *
 * 그래도 '다른 카드로 결제' 를 남긴다. 서버가 기본 카드를 표시해 주지 않아 여러 장 중
 * 첫 ACTIVE 를 고르는 짐작이고, 그 짐작이 틀렸을 때 빠져나갈 길이 없으면 안 된다.
 *
 * ⚠️ **'무료 체험 3일' 줄은 지웠다. 되살리지 말 것.** 시안에서 옮겨온 문구인데 근거가
 * 어디에도 없다 — `GET /subscription-plans` 응답에 체험 필드가 없고(id·code·name·price·
 * billingCycle·description·features[] 가 전부) 스웨거에도 trial 계열 스키마가 없다.
 * 하필 결제 버튼 바로 위라, 사실이 아니면 "3일은 공짜" 로 읽고 결제하게 된다.
 * 판정법: 구독을 한 번 성사시키고 `nextBillingAt` 을 본다 — 3일 뒤면 체험이 있는 것이다.
 */
export function PaymentConfirmSheet({
  plan,
  card,
  isPending,
  onCancel,
  onPay,
  onPayWithNewCard,
}: Props) {
  const details = planSummary(plan);
  const cycle = plan.billingCycle === 'YEARLY' ? '년' : '월';

  // 손잡이를 끌어 닫는 건 '취소' 와 같다 — 결제는 아무것도 진행되지 않는다.
  return (
    <ModalShell bottom onClose={isPending ? undefined : onCancel}>
      {/* §2 볼드 금지 — 종전 `font-bold` 였다. 21px 이면 medium 으로도 위계가 선다. */}
      <h2 className="text-center text-[21px] font-medium text-[#2C3930]">결제 확인</h2>

      <div className="mt-4 divide-y divide-[#ECECEC] overflow-hidden rounded-xl border border-[#ECECEC] bg-white">
        <Row label="상품명" value={`${details.name} · ${details.storage}`} />
        <Row label="AI 블로그" value={details.generations} />
        <Row label="결제 금액" value={`${cycle} ${details.price}`} />
        {/*
          어느 카드로 나가는지가 이 시트의 핵심 정보가 됐다 — 종전엔 결제 수단을 아예
          안 보여줬는데, 그때는 어차피 지금 입력할 카드였으니 보여줄 것도 없었다.
        */}
        <Row label="결제 수단" value={card ? card.cardNumberMasked : '등록된 카드 없음'} />
      </div>

      {/* 10px 이던 자리다 — §2 최소 13px 위반이었다. */}
      <p className="mt-4 text-center text-[13px] leading-relaxed text-[#60655C]">
        매월 자동으로 갱신돼요
        <br />
        다음 결제일 전까지 언제든 해지할 수 있어요
      </p>

      <button
        type="button"
        onClick={card ? onPay : onPayWithNewCard}
        disabled={isPending}
        className="mt-6 h-[56px] w-full rounded-xl bg-pictree-700 text-[17px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? '결제 중...' : card ? '결제하기' : '카드 등록하고 결제하기'}
      </button>

      {/*
        카드가 없으면 안 그린다 — 위 버튼이 이미 새 카드로 가는 길이라 같은 동작이
        두 개가 된다.
      */}
      {card && (
        <button
          type="button"
          onClick={onPayWithNewCard}
          disabled={isPending}
          className="mt-2 h-12 w-full text-[15px] font-medium text-[#5B6B38] underline underline-offset-4 disabled:opacity-60"
        >
          다른 카드로 결제
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="mt-2 h-12 w-full rounded-xl bg-pictree-100 text-[17px] font-medium text-pictree-700 disabled:opacity-60"
      >
        취소
      </button>
    </ModalShell>
  );
}
