import { useState } from 'react';
import { ConfirmModal, NavBar, useToast } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { formatKoreanDate } from '@/shared/lib/date';
import { ROUTES } from '@/shared/constants/routes';
import cardIcon from '@/features/profile/assets/icons/card.svg';
import { useBillingKeys, useCardRegistration, useDeleteBillingKey } from './hooks/useBillingKeys';
import { useMySubscription } from './hooks/useMySubscription';
import { formatCardNumber, isActiveCard } from './lib/billingKey';
import type { BillingKeyDto } from './types/payment';

/**
 * 자동결제 카드(빌링키) 관리 화면.
 *
 * **구독 관리와 따로 두는 이유.** 카드는 구독보다 오래 산다 — 해지해도 빌링키는 남고,
 * 카드 만료·재발급은 구독 상태와 아무 상관 없이 일어난다. 한 화면에 섞으면 카드를 바꾸러
 * 들어간 사람이 구독 해지 버튼 옆에 서게 되고, 반대로 해지하러 온 사람은 카드 목록을
 * 지나쳐야 한다.
 *
 * 카드 정보는 우리가 보관하지 않는다. 등록은 토스 인증창이 받고(`useCardRegistration`),
 * 우리에게 남는 건 마스킹된 번호와 빌링키 id 뿐이다 — 이 화면이 보여줄 수 있는 것도
 * 딱 그만큼이다.
 */
export function PaymentMethodsPage() {
  // 히스토리가 없을 때 돌아갈 부모는 '내 정보' 다 — 이 화면으로 들어오는 줄이 거기 있다.
  const goBack = useGoBack(ROUTES.profileEdit);
  const { showToast } = useToast();
  const { data: cards, isPending, isError, refetch } = useBillingKeys();
  const { data: subscription } = useMySubscription();
  const register = useCardRegistration();
  const deleteCard = useDeleteBillingKey();
  /** 삭제 확인 중인 카드. `null` 이면 모달이 닫혀 있다. */
  const [pendingDelete, setPendingDelete] = useState<BillingKeyDto | null>(null);

  /**
   * 자동갱신이 살아 있는 구독이 있는가. 삭제 경고 문구를 가른다 — 이 상태에서 마지막
   * 카드를 지우면 다음 청구가 실패한다. 서버가 막아 주는지 확인된 바 없어 화면에서 먼저 알린다.
   */
  const hasRenewingSubscription = Boolean(
    subscription?.subscriptionId && subscription.autoRenew,
  );
  const isLastCard = (cards?.filter(isActiveCard).length ?? 0) <= 1;

  /*
    ⚠️ 실패를 반드시 화면에 띄운다. 이 버튼은 성공하면 페이지가 토스로 떠나 버리므로,
    아무 일도 안 일어나면 그건 곧 실패다 — 그런데 종전엔 훅의 `console.error` 가 유일한
    흔적이라 사용자에겐 '버튼이 죽은' 것으로 보였다.

    실제로 그 일이 있었다: `.env` 에 `VITE_TOSS_CLIENT_KEY` 가 없으면
    `requestBillingAuth` 가 첫 줄에서 던지는데, 화면에는 아무 변화가 없었다.
  */
  const handleRegister = () => {
    register.mutate(undefined, {
      onError: () =>
        showToast('카드 등록 창을 열지 못했어요. 잠시 후 다시 시도해 주세요.', 'error'),
    });
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteCard.mutate(pendingDelete.billingKeyId, {
      onSuccess: () => {
        setPendingDelete(null);
        showToast('카드를 삭제했어요.', 'info');
      },
      onError: () => {
        setPendingDelete(null);
        showToast('카드 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
      },
    });
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="px-5 pt-header">
        <NavBar onBack={goBack} title="결제 수단" />
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
        {isError ? (
          <div className="rounded-xl border border-[#DC2626] bg-white px-5 py-4 text-center">
            <p className="text-[15px] text-[#DC2626]">카드 목록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : isPending ? (
          // 카드 한 장 높이만큼 자리를 잡아 둬 등록 버튼이 위로 튀지 않게 한다.
          <div className="h-[86px] animate-pulse rounded-xl bg-[#F6F0D7]" />
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-[#ECECEC] bg-white px-5 py-8 text-center">
            <p className="text-[15px] text-[#2C3930]">등록된 카드가 없어요.</p>
            <p className="mt-1 text-[13px] text-[#60655C]">
              카드를 등록해 두면 구독이 자동으로 갱신돼요.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {cards.map((card) => {
              const active = isActiveCard(card);
              const issued = formatKoreanDate(card.issuedAt);

              return (
                <li
                  key={card.billingKeyId}
                  className="flex items-center gap-3 rounded-xl border border-[#ECECEC] bg-white px-5 py-4"
                >
                  <img src={cardIcon} alt="" className="h-6 w-6 shrink-0" />

                  <div className="min-w-0 flex-1">
                    {/* 결제 화면과 같은 꼴로 끊는다 — 같은 값을 두 화면이 다르게 보여주면
                        내 카드가 맞는지 대조할 때 한 번 더 되짚게 된다. */}
                    <p className="truncate text-[17px] font-medium text-[#2C3930]">
                      {formatCardNumber(card.cardNumberMasked)}
                    </p>
                    {/*
                      카드사 코드('11' 같은 문자열)는 안 쓴다 — 이름으로 옮길 표가 없어
                      숫자를 그대로 보여주게 되고, 그건 사용자에게 아무 뜻이 없다.
                      대신 이 카드가 실제로 청구에 쓰이는지와 언제 등록했는지를 적는다.
                    */}
                    <p className="mt-0.5 text-[13px] text-[#60655C]">
                      {active ? '자동결제 사용 중' : '사용 안 함'}
                      {issued && ` · ${issued} 등록`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(card)}
                    className="shrink-0 px-2 py-1 text-[15px] font-medium text-[#DC2626]"
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/*
          등록 버튼은 목록 상태와 무관하게 늘 있다. 조회에 실패했다고 카드를 못 넣게
          막을 이유가 없다 — 등록은 토스로 나갔다 오는 별개 흐름이다.
        */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={register.isPending}
          className="h-12 rounded-xl bg-[#ECF6D8] text-[17px] font-medium text-[#2C3930] disabled:opacity-60"
        >
          {register.isPending ? '카드 등록 창을 여는 중...' : '카드 등록'}
        </button>

        <p className="px-1 text-[13px] leading-relaxed text-[#60655C]">
          카드 정보는 토스페이먼츠가 보관해요. 픽트리에는 마스킹된 번호만 저장돼요.
        </p>
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="카드를 삭제할까요?"
        /*
          마지막 카드를 지우면 다음 청구가 실패한다. '삭제됩니다' 로만 끝내면 그 결과를
          누른 뒤에야 알게 되므로, 조건이 맞을 때만 한 문장을 더 붙인다.
        */
        message={
          hasRenewingSubscription && isLastCard
            ? '이 카드를 지우면 다음 결제일에 자동결제가 실패하고 구독이 끊길 수 있어요. 새 카드를 먼저 등록하는 걸 권해요.'
            : '등록된 자동결제 카드를 삭제해요. 필요하면 다시 등록할 수 있어요.'
        }
        confirmText="삭제"
        isConfirming={deleteCard.isPending}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
