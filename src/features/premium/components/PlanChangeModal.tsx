import { formatKoreanDate } from '@/shared/lib/date';
import { ConfirmDialog, DoneDialog } from './Dialog';
import {
  PICTREE_TOKEN_LABEL,
  formatPrice,
  planPriceLabel,
  planShortName,
  planSummary,
} from '../lib/planDisplay';
import { lastDayBefore } from '../lib/planProration';
import type { PendingPlanChangeDto, SubscriptionPlanDto } from '../types/payment';

interface UpgradeProps {
  /** 바꿀 플랜. */
  nextPlan: SubscriptionPlanDto;
  /** 오늘 청구되는 차액(원). `lib/planProration` 이 낸다. */
  chargeAmount: number;
  isPending?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}

/**
 * 업그레이드 확인 모달 — **오늘 돈이 나가고 지금 바뀐다.**
 *
 * 다운그레이드 쪽(`PlanChangeModal`)과 하는 말이 정반대라 컴포넌트를 나눴다. 저쪽의
 * 유일한 일은 '지금 안 바뀐다' 를 말하는 것이고, 이쪽은 '지금 결제된다' 를 말한다 —
 * 한 컴포넌트에 조건으로 접으면 두 문장이 서로를 흐린다.
 *
 * 그래서 오른쪽 버튼이 '변경 예약' 이 아니라 **'결제하기'** 다.
 */
export function PlanUpgradeModal({
  nextPlan,
  chargeAmount,
  isPending,
  onKeep,
  onConfirm,
}: UpgradeProps) {
  return (
    <ConfirmDialog
      label="요금제 변경 확인"
      title={`${nextPlan.name}으로 변경할까요?`}
      description={`오늘 차액 ${formatPrice(chargeAmount)}이 결제되며 ${nextPlan.name}은 결제 즉시 적용됩니다.`}
      keepLabel="취소"
      confirmLabel="결제하기"
      isPending={isPending}
      onKeep={onKeep}
      onConfirm={onConfirm}
    />
  );
}

/** 업그레이드 완료 모달. 지금부터 쓸 수 있다는 것이 전부다. */
export function PlanUpgradeDoneModal({
  planName,
  onConfirm,
}: {
  planName: string;
  onConfirm: () => void;
}) {
  return (
    <DoneDialog
      label="요금제 변경 완료"
      title={`${planName}으로 변경되었습니다.`}
      /*
        ⚠️ 여기만 `AI 초안 생성권` 이라고 불렀다 — 시안 문구를 그대로 옮긴 자리인데,
        같은 값을 비교표·히어로·FAQ 는 `PICTREE 토큰` 이라 부르고 있었다(이슈 #329).
      */
      description={`추가된 저장 용량과 ${PICTREE_TOKEN_LABEL}을 지금부터 이용할 수 있습니다.`}
      onConfirm={onConfirm}
    />
  );
}

interface DowngradeProps {
  /** 지금 쓰는 플랜 이름 ('맥스 플랜'). 서버 `subscription.plan.name` 그대로. */
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
 * 다운그레이드(변경 예약) 확인 모달.
 *
 * **이 화면의 유일한 일은 '지금 안 바뀐다' 를 말하는 것이다.** 버튼을 누른 사람은 방금
 * 고른 플랜이 곧바로 켜질 거라고 기대하는데, 서버는 이번 주기 요금을 이미 받았으므로
 * 다음 결제일에 적용한다. 그 어긋남을 여기서 못 박지 않으면 "결제했는데 용량이 그대로다"
 * 가 된다.
 *
 * 날짜는 **다음 결제일 하루 전**이다(시안: 결제일 9/15 → `9월 14일까지`). 지금 플랜을
 * 쓸 수 있는 마지막 날을 말하는 자리라 결제일 자체가 아니다.
 */
export function PlanChangeModal({
  currentPlanName,
  nextPlan,
  effectiveAt,
  isPending,
  onKeep,
  onConfirm,
}: DowngradeProps) {
  const { shortName } = planSummary(nextPlan);
  const lastDayLabel = formatKoreanDate(lastDayBefore(effectiveAt));

  return (
    <ConfirmDialog
      label="요금제 변경 확인"
      title={`${shortName}(으)로 변경하시겠어요?`}
      description={
        lastDayLabel
          ? `${currentPlanName}은 ${lastDayLabel}까지 이용할 수 있습니다.`
          : `${currentPlanName}은 다음 결제일 전까지 이용할 수 있습니다.`
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
