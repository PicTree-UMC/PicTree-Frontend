import { useState } from 'react';
import { useToast } from '@/shared/components';
import { formatKoreanMonthDay } from '@/shared/lib/date';
import { useMySubscription } from '../hooks/useMySubscription';
import { useCancelPlanChange } from '../hooks/useSubscriptionActions';
import { planShortName } from '../lib/planDisplay';
import { ConfirmDialog, DoneDialog } from './Dialog';

/**
 * 예약된 요금제 변경 배지 + 되돌리기(확인 → 취소 → 완료).
 *
 * **예약이 걸려 있을 때만 그린다.** 그 외에는 아무것도 없다 — 대부분의 사용자에게 이
 * 자리는 존재하지 않는다.
 *
 * ⚠️ **푸터에서 플랜 칩 바로 아래로 올라왔다**(#325 시안). 종전 자리는 페이지 맨 끝
 * 해지 섹션 위였는데, 예약이 걸린 사람에게 이 배지는 **비교표를 읽는 전제**다 — 표는
 * '지금 플랜 → 고른 플랜' 을 말하는데 실제로는 다음 달에 또 다른 플랜으로 바뀔 예정이라,
 * 그 사실을 표보다 아래에서 알리면 표를 이미 잘못 읽은 뒤가 된다.
 *
 * ⚠️ **배지 자체가 예약 취소 진입점이다**(시안 주석). 그래서 글자가 아니라 버튼이고,
 * 눌러도 곧장 취소하지 않는다 — 종전에는 확인 없이 바로 서버로 갔다. 예약을 걸 때는
 * 확인 모달을 거치면서 되돌릴 때는 안 거치면 두 방향의 무게가 어긋난다.
 *
 * ⚠️ 이게 없으면 예약을 건 사용자에게 화면이 거짓말을 한다 — 비교표는 지금 플랜만
 * 보여주고, 다음 달에 요금이 바뀌는 사실이 앱 어디에도 안 남는다. 되돌릴 입구도
 * 여기뿐이라 숨기면 안 된다(해지·재개를 한 자리에 모아 둔 것과 같은 이유).
 */
export function PendingPlanChangeNotice() {
  const { showToast } = useToast();
  const { data: subscription } = useMySubscription();
  const cancelMutation = useCancelPlanChange();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  /**
   * 취소가 끝난 뒤 남는 플랜 이름. 완료 모달이 이 값을 읽는다.
   *
   * 취소에 성공하면 `pendingPlanChange` 가 `null` 이 되어 이 컴포넌트가 **사라지므로**,
   * 완료 모달을 예약 값에서 파생시킬 수 없다. 그래서 응답에서 한 번 떠서 들고 있는다.
   */
  const [keptPlanName, setKeptPlanName] = useState<string | null>(null);

  const pending = subscription?.pendingPlanChange;

  const handleCancel = () => {
    if (!subscription?.subscriptionId) return;
    cancelMutation.mutate(subscription.subscriptionId, {
      onSuccess: (updated) => {
        setIsConfirmOpen(false);
        setKeptPlanName(updated.plan.name);
      },
      onError: () => {
        setIsConfirmOpen(false);
        showToast('예약 취소에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
      },
    });
  };

  // 완료 모달은 예약이 사라진 뒤에도 떠 있어야 하므로 `pending` 가드보다 위에서 그린다.
  if (keptPlanName) {
    return (
      <DoneDialog
        label="요금제 변경 예약 취소 완료"
        title="플랜 변경 예약이 취소되었습니다."
        description={`다음 결제일에도 ${keptPlanName}이 유지됩니다.`}
        onConfirm={() => setKeptPlanName(null)}
      />
    );
  }

  if (!subscription?.subscriptionId || !pending) return null;

  /*
    해 없이 '9월 15일' 이다(시안). 예약은 길어야 한 결제 주기 뒤라 연도가 정보를 더하지
    않고, 칩 줄 아래 한 줄짜리 배지에서는 길이가 곧 비용이다.
  */
  const effectiveLabel = formatKoreanMonthDay(pending.effectiveAt);
  const shortName = planShortName(pending.plan.name);

  return (
    <>
      {/*
        칩과 같은 알약 꼴이지만 고르는 것이 아니라 **알리는 것**이라 `Chip` 을 쓰지 않는다
        (저건 radio/toggle 로 낭독된다). 색은 GREEN-100 바탕 · GREEN-700 글자 —
        GREEN-500 은 데코·보더 전용이라 글자에 쓰지 않는다(§색상).
      */}
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        aria-haspopup="dialog"
        className="mt-3 rounded-full border border-pictree-500 bg-pictree-100 px-3 py-1.5 text-[13px] font-medium text-pictree-700"
      >
        {effectiveLabel
          ? `${effectiveLabel} ${shortName}(으)로 변경 예정`
          : `다음 결제일 ${shortName}(으)로 변경 예정`}
      </button>

      {isConfirmOpen && (
        <ConfirmDialog
          label="요금제 변경 예약 취소 확인"
          title="플랜 변경 예약을 취소할까요?"
          description={`취소하면 ${subscription.plan.name}이 다음 결제일에도 유지됩니다.`}
          /*
            '취소' 라는 낱말이 양쪽에 다 들어가는 자리라 버튼이 서로를 설명해야 한다 —
            `취소`/`확인` 으로 두면 무엇을 취소하는 건지(예약인지 구독인지)가 안 갈린다.
          */
          keepLabel="현재 예약 유지"
          confirmLabel="변경 예약 취소"
          isPending={cancelMutation.isPending}
          onKeep={() => setIsConfirmOpen(false)}
          onConfirm={handleCancel}
        />
      )}
    </>
  );
}
