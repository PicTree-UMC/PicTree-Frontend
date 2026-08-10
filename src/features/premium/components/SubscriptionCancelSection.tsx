import { useState } from 'react';
import { useToast } from '@/shared/components';
import { formatKoreanDate } from '@/shared/lib/date';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { useMySubscription } from '../hooks/useMySubscription';
import {
  useCancelSubscription,
  useResumeSubscription,
} from '../hooks/useSubscriptionActions';

/**
 * 페이지 맨 아래 해지 자리.
 *
 * 해지는 이 페이지에서만 할 수 있다 — 프로필의 '구독 및 결제' 가 곧장 여기로 오게 되면서
 * 구 구독 관리 화면이 유일한 입구 자리를 내놓았다.
 *
 * **맨 아래에 두는 것이 맞다.** 위쪽은 파는 자리고 해지는 사는 것의 반대다. 파는 문구 옆에
 * 붉은 버튼을 놓으면 둘 다 흐려진다. 스크롤 끝까지 내려온 사람만 만나게 두면, 찾는 사람은
 * 반드시 찾고(입구가 여기뿐이라 숨기면 안 된다) 사러 온 사람의 눈에는 안 걸린다.
 *
 * **구독한 적 있는 사람에게만 그린다.** 무료 사용자에게 해지 버튼은 의미가 없을 뿐 아니라,
 * 방금 결제하려던 화면 아래에 붉은 글자가 있으면 결제 자체를 망설이게 한다.
 *
 * ⚠️ `autoRenew` 만 보고 그리면 안 된다 — 구독한 적 없는 사용자에게도 서버가
 * `{ subscriptionId: null, autoRenew: false }` 를 준다. `subscriptionId` 가 있어야
 * 실제로 구독한 것이다(구 SubscriptionPage 에서 이걸 놓쳐 만료일 자리에 1970년이 떴다).
 *
 * 해지해도 만료일까지는 구독이 살아 있고 `autoRenew` 만 꺼진다. 그 상태에서 버튼을 '구독
 * 취소' 로 그대로 두면 이미 해지했는지 알 수 없으므로 **재개**로 바꾼다 — 여기가 유일한
 * 입구라, 재개를 빼면 실수로 누른 사람이 되돌릴 방법이 없다.
 */
export function SubscriptionCancelSection() {
  const { showToast } = useToast();
  const { data: subscription } = useMySubscription();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // 조회 실패·로딩 중에는 아무것도 그리지 않는다. 구독자에게 잠깐 안 보이는 쪽이,
  // 무료 사용자에게 해지 버튼이 잠깐 떴다 사라지는 쪽보다 낫다.
  if (!subscription?.subscriptionId) return null;

  const isCanceled = !subscription.autoRenew;

  const handleCancel = () => {
    cancelMutation.mutate(subscription.subscriptionId, {
      onSuccess: () => {
        setIsCancelOpen(false);
        // 만료일을 모르면 날짜를 지어내지 않고 문장만 바꾼다.
        const until = formatKoreanDate(subscription.expiresAt);
        showToast(
          until
            ? `구독을 취소했어요. ${until}까지 그대로 이용할 수 있어요.`
            : '구독을 취소했어요. 남은 기간 동안은 그대로 이용할 수 있어요.',
          'info',
        );
      },
      onError: () => {
        setIsCancelOpen(false);
        showToast('구독 취소에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
      },
    });
  };

  const handleResume = () => {
    resumeMutation.mutate(subscription.subscriptionId, {
      onSuccess: () => showToast('자동갱신을 다시 켰어요.', 'success'),
      onError: () =>
        showToast('자동갱신 재개에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error'),
    });
  };

  const expiresLabel = formatKoreanDate(subscription.expiresAt);
  const nextBillingLabel = formatKoreanDate(subscription.nextBillingAt);

  return (
    /*
      위 고지와의 간격을 이 컴포넌트가 갖는다 — 부모가 감싸는 div 에 주면, 구독자가
      아닐 때(이 컴포넌트가 `null` 을 돌려줄 때) 빈 div 의 margin 만 남아 푸터 아래에
      32px 짜리 유령 여백이 생긴다.
    */
    /*
      푸터의 글은 전부 왼쪽 정렬이다 — 위쪽(표지·섹션 제목)이 가운데인 것과 일부러 다르다.
      가운데 정렬은 훑어보라는 신호라 표지에는 맞지만, 여기는 조건과 상태를 한 줄씩 읽는
      자리고 줄마다 시작점이 달라지면 읽는 눈이 매번 왼쪽 끝을 다시 찾아야 한다.
    */
    <section className="mt-8 flex flex-col items-start gap-2">
      {/*
        상태 한 줄을 버튼 위에 둔다. '언제까지 쓸 수 있는가' 를 모른 채 해지를 누르면
        지금 당장 끊긴다고 오해하기 쉽다 — 실제로는 만료일까지 그대로 쓴다.

        **13px 이 아니라 15px 이다.** 바로 위 고지와 같은 크기로 두면 둘 다 잔글씨로
        읽혀 넘어가는데, 이쪽은 잔글씨가 아니라 지금 내 구독의 상태다 — 이 페이지에서
        13px 은 고지에만 쓴다.
      */}
      {isCanceled ? (
        <p className="text-[15px] text-ink-muted">
          {expiresLabel
            ? `자동갱신이 꺼져 있어요. ${expiresLabel}까지 이용할 수 있어요.`
            : '자동갱신이 꺼져 있어요.'}
        </p>
      ) : (
        nextBillingLabel && (
          <p className="text-[15px] text-ink-muted">
            다음 결제일 : {nextBillingLabel}
          </p>
        )
      )}

      {isCanceled ? (
        <button
          type="button"
          onClick={handleResume}
          disabled={resumeMutation.isPending}
          className="h-12 w-full rounded-xl bg-white text-[15px] font-medium text-ink disabled:opacity-60"
        >
          {resumeMutation.isPending ? '처리 중...' : '자동갱신 다시 켜기'}
        </button>
      ) : (
        /*
          면 없는 글자 버튼이다. 위쪽 결제 CTA 들이 채워진 면이라, 해지까지 면을 가지면
          같은 무게로 읽힌다. 되돌릴 수 있는 동작(만료일까지 유지 + 재개 가능)이라
          §1.1 의 ERROR 면(#FEF7F7)까지 쓸 일은 아니고, 글자만 ERROR 로 둔다.
        */
        <button
          type="button"
          onClick={() => setIsCancelOpen(true)}
          // `px-4` 를 뺐다 — 왼쪽 정렬이 되면서 그 패딩이 글자만 16px 안으로 들여쓴 꼴이 됐다.
          className="h-12 text-[15px] font-medium text-error underline underline-offset-4"
        >
          구독 해지
        </button>
      )}

      {isCancelOpen && (
        <CancelSubscriptionModal
          onKeep={() => setIsCancelOpen(false)}
          onCancel={handleCancel}
          isPending={cancelMutation.isPending}
        />
      )}
    </section>
  );
}
