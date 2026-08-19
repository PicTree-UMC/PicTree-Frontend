import { formatKoreanDate } from '@/shared/lib/date';
import { ConfirmDialog, DoneDialog } from './Dialog';
import { planPriceLabel, planShortName, planSummary } from '../lib/planDisplay';
import type { PendingPlanChangeDto, SubscriptionPlanDto } from '../types/payment';

interface ConfirmProps {
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
 * ⚠️ **시안의 `맥스 플랜은 9월 14일까지 이용할 수 있습니다` 를 그대로 쓰지 않았다.**
 * 그 날짜는 `nextBillingAt - 1일` 인데, 서버가 주는 건 **시각까지 붙은 결제 순간**이라
 * (`2026-09-15T10:00:00Z`) 하루를 빼면 "9월 15일 오전까지는 아직 맥스" 인 구간을 화면이
 * 잘라 먹는다. 같은 말을 뺄셈 없이 하는 쪽으로 적었다 — 어차피 완료 모달과 예약 배지가
 * 둘 다 `9월 15일부터` 로 말하므로 화면 전체가 한 날짜만 쓴다.
 */
export function PlanChangeModal({
  currentPlanName,
  nextPlan,
  effectiveAt,
  isPending,
  onKeep,
  onConfirm,
}: ConfirmProps) {
  const { shortName } = planSummary(nextPlan);
  const effectiveLabel = formatKoreanDate(effectiveAt);

  return (
    <ConfirmDialog
      label="요금제 변경 확인"
      title={`${shortName}(으)로 변경하시겠어요?`}
      description={
        <>
          {effectiveLabel
            ? `${effectiveLabel} 다음 결제일부터 적용돼요.`
            : '다음 결제일부터 적용돼요.'}
          <br />
          그때까지는 {currentPlanName}을 그대로 이용해요.
        </>
      }
      /* 바뀔 값 두 개(이름·가격)만 짚는다. 혜택 비교는 바로 뒤 표가 이미 하고 있다. */
      detail={
        <span className="flex items-center justify-center gap-2">
          <span className="text-ink-muted">{currentPlanName}</span>
          <span aria-hidden className="text-ink-disabled">
            →
          </span>
          <span>{nextPlan.name}</span>
          <span className="text-ink-muted">· {planPriceLabel(nextPlan)}</span>
        </span>
      }
      keepLabel="취소"
      confirmLabel="변경 예약"
      isPending={isPending}
      onKeep={onKeep}
      onConfirm={onConfirm}
    />
  );
}

/**
 * 요금제 변경 예약 **완료** 모달.
 *
 * 종전엔 토스트 한 줄이었다(`요금제 변경을 예약했어요`). 예약은 다음 결제일에야 일어나
 * 화면에 아무 변화가 없는 동작이라, 사라지는 줄로 알리면 눌린 건지도 남지 않는다.
 * 언제부터 무엇이 바뀌는지를 날짜로 못 박는 것이 이 모달의 일이다(`DoneDialog` 주석).
 *
 * 값은 예약 응답(`SubscriptionDto.pendingPlanChange`)에서 그대로 온다 — 캐시 무효화가
 * 끝나기를 기다리지 않아도 되고, 서버가 확정한 `effectiveAt` 을 쓰게 된다.
 */
export function PlanChangeDoneModal({
  pending,
  onConfirm,
}: {
  pending: PendingPlanChangeDto;
  onConfirm: () => void;
}) {
  // ⚠️ `planSummary` 가 아니라 `planShortName` 이다 — 예약 응답의 `plan` 은 요약
  // (`SubscriptionPlanSummary`)이라 `features[]` 가 없어서 저쪽에 넣으면 터진다.
  const shortName = planShortName(pending.plan.name);
  const effectiveLabel = formatKoreanDate(pending.effectiveAt);

  return (
    <DoneDialog
      label="요금제 변경 예약 완료"
      title={`${shortName} 변경 예약이 완료되었습니다.`}
      description={
        effectiveLabel
          ? `${effectiveLabel}부터 ${pending.plan.name}이 적용됩니다.`
          : `다음 결제일부터 ${pending.plan.name}이 적용됩니다.`
      }
      onConfirm={onConfirm}
    />
  );
}
