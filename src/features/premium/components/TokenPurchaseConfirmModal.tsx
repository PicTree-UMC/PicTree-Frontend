import { useId } from 'react';
import { createPortal } from 'react-dom';

import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';

import { formatPrice } from '../lib/planDisplay';
import type { TokenProduct } from '../types/tokenProduct';

/**
 * 생성권 추가 구매 확인창 (WF-021).
 *
 * **iOS 알럿 규격이다** — 흰 카드 · 세로 버튼 스택 · 구분선. 시안이 그 모양이고, 앱에서
 * 같은 규격을 쓰는 것이 공용 `DeleteConfirmModal` 이다.
 *
 * ⚠️ **그 공용 컴포넌트를 쓰지 않는다.** 두 가지가 안 맞는다:
 *  1. 그쪽은 **파괴적 동작 전용**이라 확인 버튼이 ERROR 색이다. 생성권을 사는 건 잃는
 *     동작이 아닌데 빨강을 쓰면 삭제와 같은 무게로 읽힌다.
 *  2. 시안에 **값 줄**(`추가 생성권 / 10회`)이 있는데 그 컴포넌트엔 그런 자리가 없다.
 *
 * 요금제 변경 흐름의 `Dialog`(크림 카드 · 가로 버튼)와도 규격이 다르다 — 그쪽은 350px
 * 크림 카드에 버튼이 나란히 서고, 여기는 시안대로 300px 흰 카드에 세로로 쌓인다.
 */
export function TokenPurchaseConfirmModal({
  product,
  isPending,
  onConfirm,
  onCancel,
}: {
  /** 사려는 상품. 문구의 회수·금액이 전부 여기서 나온다 — 화면에 숫자를 박지 않는다. */
  product: TokenProduct;
  /** 요청이 나가 있는 동안 두 버튼을 잠근다. */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  useLockBodyScroll();

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[60] mx-auto flex items-center justify-center bg-black/40 px-8 sm:max-w-[390px]"
      role="presentation"
      onClick={isPending ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-[300px] overflow-hidden rounded-[14px] bg-white text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pb-4 pt-6">
          {/*
            `break-keep` — 기본값에서 브라우저가 한글을 글자 단위로 끊어 `구매하시겠어 / 요?`
            처럼 낱말 가운데가 갈린다. 회수가 한 자리·두 자리로 달라져 길이를 미리 못 재는
            문구라 `<br />` 로 손수 끊을 수도 없다.
          */}
          <h2 id={titleId} className="break-keep text-[17px] font-medium leading-[24px] text-ink">
            AI 초안 생성권 {product.quantity}회를 구매하시겠어요?
          </h2>

          <p
            id={descriptionId}
            className="mt-2 break-keep text-[15px] leading-[22px] text-ink-muted"
          >
            결제 완료 즉시 생성권이 추가되며,
            <br />
            현재 구독 플랜은 변경되지 않습니다.
          </p>
        </div>

        {/*
          값 줄. 위 문장이 말한 것을 숫자로 한 번 더 못 박는 자리다 — 확인창에서 사용자가
          마지막으로 대조하는 값이라 문장 안에 섞지 않고 따로 세운다.
        */}
        <div className="flex items-center justify-between border-t border-line-soft px-5 py-3">
          <span className="text-[15px] text-ink-muted">추가 생성권</span>
          <span className="text-[15px] font-medium text-ink">{product.quantity}회</span>
        </div>

        <div className="border-t border-line-soft">
          {/*
            ⚠️ 확인 버튼에 **금액을 적는다**(`3,500원 결제하기`). 위 값 줄이 말하는 건 회수라,
            버튼까지 '구매하기' 로 두면 얼마가 빠지는지 모르는 채로 마지막 탭을 하게 된다.
          */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-[50px] w-full text-[15px] font-medium text-ink active:bg-line-soft disabled:opacity-50"
          >
            {isPending ? '처리 중...' : `${formatPrice(product.price)} 결제하기`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-[50px] w-full border-t border-line-soft text-[15px] text-ink-muted active:bg-line-soft disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
