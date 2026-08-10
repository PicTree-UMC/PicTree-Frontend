import { useToast } from '@/shared/components';
import { formatKoreanDate } from '@/shared/lib/date';
import { useMySubscription } from '../hooks/useMySubscription';
import { useCancelPlanChange } from '../hooks/useSubscriptionActions';

/**
 * 예약된 요금제 변경 한 줄 + 되돌리기.
 *
 * **예약이 걸려 있을 때만 그린다.** 그 외에는 아무것도 없다 — 대부분의 사용자에게 이
 * 자리는 존재하지 않는다.
 *
 * **`SubscriptionCancelSection` 위에 둔다.** 둘 다 '지금 내 구독이 어떤 상태인가' 지만,
 * 예약은 다가올 일이고 해지는 끝내는 일이다. 끝내는 쪽을 맨 아래에 두는 배치를 지킨다
 * (그쪽 주석 참고).
 *
 * ⚠️ 이게 없으면 예약을 건 사용자에게 화면이 거짓말을 한다 — 비교표는 지금 플랜만
 * 보여주고, 다음 달에 요금이 바뀌는 사실이 앱 어디에도 안 남는다. 되돌릴 입구도
 * 여기뿐이라 숨기면 안 된다(해지·재개를 한 자리에 모아 둔 것과 같은 이유).
 */
export function PendingPlanChangeNotice() {
  const { showToast } = useToast();
  const { data: subscription } = useMySubscription();
  const cancelMutation = useCancelPlanChange();

  const pending = subscription?.pendingPlanChange;
  if (!subscription?.subscriptionId || !pending) return null;

  const effectiveLabel = formatKoreanDate(pending.effectiveAt);

  const handleCancel = () => {
    cancelMutation.mutate(subscription.subscriptionId, {
      onSuccess: () =>
        showToast(`예약을 취소했어요. ${subscription.plan.name}을 그대로 이용해요.`, 'info'),
      onError: () =>
        showToast('예약 취소에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error'),
    });
  };

  return (
    <section className="mt-8 flex flex-col items-start gap-2">
      {/*
        15px 이다. 바로 위 고지(13px)와 같은 크기로 두면 잔글씨로 읽혀 넘어가는데,
        이건 잔글씨가 아니라 다음 달에 요금이 바뀐다는 통지다.
      */}
      <p className="text-[15px] text-ink-muted">
        {effectiveLabel
          ? `${effectiveLabel}부터 ${pending.plan.name}으로 바뀌어요.`
          : `다음 결제일부터 ${pending.plan.name}으로 바뀌어요.`}
      </p>

      {/*
        면 없는 글자 버튼 — 위쪽 CTA 들이 채워진 면이라 여기까지 면을 가지면 같은 무게로
        읽힌다. 되돌리는 동작이지 위험한 동작이 아니라 ERROR 색도 안 쓴다(해지 버튼이
        빨강인 것과 갈라지는 지점이다).
      */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelMutation.isPending}
        className="h-12 text-[15px] font-medium text-ink underline underline-offset-4 disabled:opacity-60"
      >
        {cancelMutation.isPending ? '처리 중...' : '예약 취소하고 지금 플랜 유지'}
      </button>
    </section>
  );
}
