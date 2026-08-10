import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavBar } from '@/shared/components';
import cardIcon from '@/features/profile/assets/icons/card.svg';
import { PREMIUM_GRADIENT_CLASS } from '../lib/backdrop';
import { formatCardNumber } from '../lib/billingKey';
import { planPriceLabel, planSummary } from '../lib/planDisplay';
import type { BillingKeyDto, SubscriptionPlanDto } from '../types/payment';

type Props = {
  plan: SubscriptionPlanDto;
  /** 결제에 쓸 수 있는 카드(ACTIVE)만. 비어 있으면 새 카드로 가는 길만 남는다. */
  cards: BillingKeyDto[];
  /** 등록 카드로 결제하는 중(`POST /subscriptions` 대기). 새 카드 길은 페이지가 떠나므로 해당 없다. */
  isPending?: boolean;
  onCancel: () => void;
  /** 등록 카드로 바로 결제. */
  onPay: (billingKeyId: number) => void;
  /** 토스 인증창을 열어 새 카드로 결제. */
  onPayWithNewCard: () => void;
};

/** 목록에서 '새 카드' 를 고른 상태. 빌링키 id 와 같은 칸에 들어가므로 숫자와 안 겹치는 값이어야 한다. */
const NEW_CARD = 'new-card' as const;

type Selection = number | typeof NEW_CARD;

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className={`shrink-0 ${emphasis ? 'text-[17px]' : 'text-[15px]'} text-ink-muted`}>
        {label}
      </span>
      <span
        className={`text-right font-medium text-ink ${
          emphasis ? 'text-[21px]' : 'text-[15px]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * 결제 직전 확인 화면 — **풀스크린이다.**
 *
 * 종전엔 하단 바텀시트였다. 시트는 '조금 확인하고 돌아갈 것' 이라는 신호라서, 뒤에 비치는
 * 요금제 화면이 계속 눈에 들어오고 손잡이를 잘못 끌면 닫힌다. 결제는 그런 동작이 아니다 —
 * 카드를 고르고 금액을 확인해 돈을 내는, 그 자체로 하나의 단계다. 화면을 통째로 가져가면
 * 지금 무엇을 하는 중인지가 분명해지고, 카드가 여러 장일 때 목록이 길어져도 시트 높이에
 * 눌리지 않는다.
 *
 * **결제 수단은 목록에서 고른다.** 종전엔 첫 ACTIVE 카드 한 장을 화면이 대신 골라 주고
 * '다른 카드로 결제' 라는 밑줄 글자만 곁들였다. 서버가 기본 카드를 알려주지 않아 그 고름은
 * 목록 순서에 기댄 짐작인데, 짐작을 기본값으로 놓고 바꾸는 길을 작게 두면 자기 의도와 다른
 * 카드로 결제하기 쉽다. 카드를 나란히 늘어놓으면 무엇으로 나가는지가 고르는 행동 자체에서
 * 드러난다.
 *
 * **점선 칸이 새 카드 자리다.** 등록된 카드와 같은 목록에 두되 테두리를 점선으로 둬서
 * '아직 없는 것' 임을 모양으로 말한다. 이 칸을 고르면 결제 버튼이 토스 인증창을 연다.
 *
 * ⚠️ **금액은 총액 한 줄뿐이다.** 소계·세금으로 쪼개지 않는다 — 서버가 주는 건 `price`
 * 하나고 부가세 포함 여부가 확인된 바 없다(`types/payment.ts`). 결제 직전 화면에서 근거
 * 없는 금액을 만들어 적으면 사용자가 돈을 낸 근거가 틀린 것이 된다. 백엔드가 부가세 필드를
 * 주면 그때 줄을 늘린다.
 *
 * ⚠️ **'무료 체험 3일' 줄은 지웠다. 되살리지 말 것.** 시안에서 옮겨온 문구인데 근거가
 * 어디에도 없다 — `GET /subscription-plans` 응답에 체험 필드가 없고 스웨거에도 trial 계열
 * 스키마가 없다. 판정법: 구독을 한 번 성사시키고 `nextBillingAt` 을 본다 — 3일 뒤면 있는 것이다.
 */
export function PaymentCheckoutView({
  plan,
  cards,
  isPending,
  onCancel,
  onPay,
  onPayWithNewCard,
}: Props) {
  const details = planSummary(plan);
  /*
    첫 카드를 미리 골라 둔다. 여전히 목록 순서에 기댄 짐작이지만, 이제 나머지 카드가 같은
    화면에 다 보이므로 틀렸을 때 한 번 누르면 바뀐다. 카드가 없으면 새 카드 칸이 유일한 길이다.
  */
  const [selected, setSelected] = useState<Selection>(cards[0]?.billingKeyId ?? NEW_CARD);
  const isNewCard = selected === NEW_CARD;

  const handleSubmit = () => {
    if (isNewCard) {
      onPayWithNewCard();
      return;
    }
    onPay(selected);
  };

  return createPortal(
    /*
      탭바(z-40)와 페이지 배경 레이어 위를 덮는다. 결제 중에는 다른 탭으로 새는 길이 없어야
      한다 — 뒤로 가는 길은 헤더의 뒤로가기 하나다.

      **바닥은 요금제 화면과 같은 그라데이션이다.** 크림으로 돌려놓으면 고르던 자리를 떠나
      설정 화면으로 들어온 것처럼 읽히는데, 결제는 이 흐름의 끝이지 다른 곳이 아니다.
      값은 `lib/backdrop.ts` 한 곳에 있고 요금제 화면과 나눠 쓴다.

      요금제 화면처럼 별도 레이어를 깔지 않고 이 컨테이너의 배경으로 바로 든다 — 포털로
      body 에 붙어 `AppShell` 바깥이라 크림이 덮을 일이 없고(그쪽 ⚠️ 페인트 순서 문제),
      뷰포트를 그대로 채우므로 늘어나 색이 옅어질 일도 없다.
    */
    <div
      className={`fixed inset-0 z-50 mx-auto flex w-full flex-col sm:max-w-[390px] ${PREMIUM_GRADIENT_CLASS}`}
      role="dialog"
      aria-modal="true"
      aria-label="결제하기"
    >
      {/*
        결제 중에는 뒤로 못 나간다. 요청이 날아가는 중에 화면을 닫으면 결제가 됐는지 안 됐는지
        모르는 채로 요금제 화면에 서게 된다.
      */}
      <header className="shrink-0 px-5 pt-header">
        <NavBar onBack={isPending ? undefined : onCancel} title="결제하기" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* §2 볼드 금지 — 21px 이면 medium 으로도 위계가 선다. */}
        <h2 className="mt-6 text-[21px] font-medium text-ink">확인 후 결제하기</h2>
        <p className="mt-1 text-[15px] text-ink-muted">
          등록한 카드로 안전하게 결제할 수 있어요
        </p>

        {/*
          라디오 그룹이다 — 여러 개 중 하나만 쓰인다. `Chip` 을 쓰지 않는 건 이게 가로로
          늘어놓고 고르는 알약이 아니라 세로 목록이기 때문이다(§5 는 칩 줄의 규칙이다).
        */}
        <ul className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="결제 수단">
          {cards.map((card) => {
            const active = selected === card.billingKeyId;

            return (
              <li key={card.billingKeyId}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(card.billingKeyId)}
                  disabled={isPending}
                  /*
                    고름 표시는 테두리로만 한다. 면까지 바꾸면 목록에서 안 고른 카드가
                    비활성처럼 읽히는데, 넷 다 언제든 고를 수 있는 것들이다(§5 와 같은 결).
                    테두리는 2px GREEN-700 — 1px 로는 흰 카드 위에서 두께 차이가 안 보인다.
                  */
                  className={`flex w-full items-center gap-3 rounded-xl bg-white px-5 py-4 text-left ${
                    active ? 'border-2 border-pictree-700' : 'border border-line-soft'
                  }`}
                >
                  <img src={cardIcon} alt="" className="h-6 w-6 shrink-0" />
                  <span className="shrink-0 text-[17px] font-medium text-ink">
                    신용카드
                  </span>
                  {/*
                    카드사 코드('11' 같은 문자열)는 안 쓴다 — 이름으로 옮길 표가 없어 숫자를
                    그대로 보여주게 되고, 그건 사용자에게 아무 뜻이 없다. 여러 장을 가릴 근거는
                    마스킹 번호뿐이라 오른쪽 끝에 그것만 둔다.
                  */}
                  <span className="ml-auto min-w-0 truncate text-[15px] text-ink-muted">
                    {formatCardNumber(card.cardNumberMasked)}
                  </span>
                </button>
              </li>
            );
          })}

          {/*
            새 카드 자리. 점선은 '아직 채워지지 않은 칸' 을 뜻한다 — 위의 실선 카드들과 같은
            목록에 있으면서도 등록된 것이 아니라는 게 모양으로 읽힌다.

            ⚠️ 안 고른 상태의 점선은 **GREEN-500** 이다. GREEN-300(`#C5D89D`)을 쓰면 배경
            그라데이션 맨 위가 바로 그 색이라 테두리가 통째로 사라진다 — 이 칸은 면이 없어서
            테두리가 사라지면 칸 자체가 없어진다. 500 은 텍스트로는 못 쓰지만 테두리·데코는
            그게 제 자리다(§1.2).
          */}
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={isNewCard}
              onClick={() => setSelected(NEW_CARD)}
              disabled={isPending}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-4 ${
                isNewCard ? 'border-pictree-700 bg-white' : 'border-pictree-500 bg-transparent'
              }`}
            >
              <span className="text-[17px] font-medium text-pictree-700">
                + 다른 카드로 결제
              </span>
            </button>
          </li>
        </ul>

        {/*
          금액. 상품명과 총액 둘뿐이고 그 사이에 줄을 끼우지 않는다 — 위 ⚠️ 참고.
          총액만 21px 로 키워 '이 화면에서 확인할 숫자' 를 하나로 만든다.

          **선은 총액 아래 하나뿐이다.** 금액 위에도 긋고 아래에도 그으면 금액이 상자에
          갇혀 목록과 따로 노는 덩어리가 되는데, 여기서 선이 할 일은 칸을 나누는 게 아니라
          **읽기를 여기서 멈추는 것**이다 — 위는 확인할 것들이고 아래는 고지다. 카드 목록과
          금액 사이는 여백(32px)만으로 갈린다.

          ⚠️ 선 색은 INK 반투명이다. `border-line-soft` 헤어라인(§8)은 흰 카드 위에서 쓰라고 고른
          값이라 이 그라데이션 위에서는 거의 안 보인다 — 바닥이 색을 갖는 화면에서는 선도
          바닥을 따라 어두워져야 한다(크림 위 `RouteCreatePage` 가 같은 방식이다).
        */}
        <div className="mt-8 border-b border-ink/10 pb-4">
          <SummaryRow label="상품명" value={`${details.name} · ${details.storage}`} />
          <SummaryRow label="총 결제 금액" value={planPriceLabel(plan)} emphasis />
        </div>

        {/* 13px 은 이 흐름에서 가장 작은 단이고 고지에만 쓴다(§2 최소 13px). */}
        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
          매월 자동으로 갱신되고, 다음 결제일 전까지 언제든 해지할 수 있어요.
          <br />
          카드 정보는 토스페이먼츠가 보관해요. 픽트리에는 마스킹된 번호만 저장돼요.
        </p>
      </div>

      {/*
        결제 버튼은 아래에 고정한다. 카드가 늘어 목록이 길어져도 결제하러 스크롤을 내릴 필요가
        없고, 위 금액과 이 버튼이 늘 같은 화면에 함께 있다.

        선을 긋지 않는다 — 버튼 자체가 짙은 덩어리라 바닥에서 이미 떨어져 보이고, 선까지
        더하면 화면 아래에 가로줄이 둘(고지 위 · 버튼 위) 생긴다.
      */}
      <div className="shrink-0 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="h-[52px] w-full rounded-xl bg-pictree-700 text-[17px] font-medium text-white disabled:bg-line-soft disabled:text-ink-muted"
        >
          {isPending ? '결제 중...' : isNewCard ? '카드 등록하고 결제하기' : '결제하기'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
