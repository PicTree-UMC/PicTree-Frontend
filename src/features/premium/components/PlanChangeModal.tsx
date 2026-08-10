import { formatKoreanDate } from '@/shared/lib/date';
import { planPriceLabel, planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

interface Props {
  /** 지금 쓰는 플랜 이름 ('플러스 플랜'). 서버 `subscription.plan.name` 그대로. */
  currentPlanName: string;
  /** 바꿀 플랜. */
  nextPlan: SubscriptionPlanDto;
  /** 변경이 적용되는 시점 = 다음 결제일. 없으면 날짜를 지어내지 않고 문장만 바꾼다. */
  effectiveAt: string | null;
  isPending?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}

/**
 * 요금제 변경 예약 확인 모달.
 *
 * **이 화면의 유일한 일은 '지금 안 바뀐다' 를 말하는 것이다.** 버튼을 누른 사람은 방금
 * 고른 플랜이 곧바로 켜질 거라고 기대하는데, 서버는 이번 주기 요금을 이미 받았으므로
 * 다음 결제일에 적용한다. 그 어긋남을 여기서 못 박지 않으면 "결제했는데 용량이 그대로다"
 * 가 된다.
 *
 * 해지 모달(`CancelSubscriptionModal`)과 규격은 같지만 **경고 아이콘도 빨강도 안 쓴다** —
 * 잃는 동작이 아니라 예약이고, 되돌리는 길(예약 취소)도 바로 아래 푸터에 있다.
 */
export function PlanChangeModal({
  currentPlanName,
  nextPlan,
  effectiveAt,
  isPending,
  onKeep,
  onConfirm,
}: Props) {
  const { shortName } = planSummary(nextPlan);
  const effectiveLabel = formatKoreanDate(effectiveAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
      onClick={onKeep}
    >
      <div
        role="dialog"
        aria-label="요금제 변경 확인"
        className="w-full max-w-[352px] rounded-[20px] bg-cream px-6 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-center text-[20px] font-medium text-ink">
          {shortName} 플랜으로 바꿀까요?
        </p>

        {/*
          ⚠️ 적용 시점이 이 모달의 본문이다. 13px 고지로 흘리지 않고 15px 로 둔다 —
          잔글씨가 아니라 이 동작이 무엇인지 자체다.
        */}
        <p className="mt-2 text-center text-[15px] leading-[22px] text-ink-muted">
          {effectiveLabel
            ? `${effectiveLabel} 다음 결제일부터 적용돼요.`
            : '다음 결제일부터 적용돼요.'}
          <br />
          그때까지는 {currentPlanName}을 그대로 이용해요.
        </p>

        {/* 바뀔 값 두 개(이름·가격)만 짚는다. 혜택 비교는 바로 뒤 표가 이미 하고 있다. */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line-soft bg-white py-4 text-[15px] font-medium text-ink">
          <span className="text-ink-muted">{currentPlanName}</span>
          <span aria-hidden className="text-ink-disabled">
            →
          </span>
          <span>{nextPlan.name}</span>
          <span className="text-ink-muted">· {planPriceLabel(nextPlan)}</span>
        </div>

        <div className="mt-5 flex justify-center gap-4">
          <button
            type="button"
            onClick={onKeep}
            disabled={isPending}
            className="h-[38px] w-[120px] rounded-xl bg-line-soft text-[15px] font-medium text-ink disabled:opacity-60"
          >
            그대로 두기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-[38px] w-[120px] rounded-xl bg-pictree-700 text-[15px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? '처리 중...' : '변경 예약'}
          </button>
        </div>
      </div>
    </div>
  );
}
