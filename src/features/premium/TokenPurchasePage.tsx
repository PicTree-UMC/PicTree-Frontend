import { useEffect, useState } from 'react';

import { NavBar, PrimaryCta, Skeleton, useToast } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { ROUTES } from '@/shared/constants/routes';

import { usePictreeToken } from './hooks/usePictreeToken';
import { useTokenProducts } from './hooks/useTokenProducts';
import { IS_TOKEN_PURCHASE_READY } from './api/tokenProductApi';
import { TokenPurchaseConfirmModal } from './components/TokenPurchaseConfirmModal';
import { formatPrice } from './lib/planDisplay';
import type { TokenProduct } from './types/tokenProduct';

/** 요약표 한 줄. 라벨은 고정폭, 값은 남는 폭 — `PaymentDetailPage` 의 `Field` 와 같은 규칙. */
function SummaryRow({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft px-5 py-3.5 last:border-b-0">
      <span className="shrink-0 text-[15px] text-ink-muted">{label}</span>
      <span
        className={`min-w-0 flex-1 text-right text-[15px] text-ink ${
          emphasis ? 'font-medium' : ''
        }`}
      >
        {children}
      </span>
    </div>
  );
}

/**
 * 수량 칩 한 개.
 *
 * ⚠️ **`aria-pressed` 로 선택을 알린다.** 색만으로 고른 것을 표시하면 낭독기 사용자에게는
 * 세 칩이 똑같이 읽힌다. 라디오 그룹이 아니라 토글 버튼으로 두는 이유는, 이 줄이 폼이
 * 아니라 화면 상태를 바꾸는 장치이기 때문이다(비교표 플랜 칩과 같은 결).
 */
function QuantityChip({
  product,
  isSelected,
  onSelect,
}: {
  product: TokenProduct;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`h-[42px] flex-1 rounded-[21px] text-[15px] font-medium transition-colors ${
        isSelected ? 'bg-pictree-700 text-cream' : 'border border-line bg-white text-ink'
      }`}
    >
      {product.quantity}회
    </button>
  );
}

/**
 * AI 초안 생성권 추가 구매 (WF-021).
 *
 * 구독 플랜을 건드리지 않고 생성권만 **일회성으로** 더 사는 화면이다. 들어오는 길은 둘 —
 * 마이페이지 요약의 토큰 칸, 그리고 블로그 생성 흐름에서 생성권을 다 썼을 때다.
 *
 * ⚠️⚠️ **아직 실제로 결제되지 않는다.** 일회성 결제 주문 API 가 없고(지금
 * `POST /payment-orders` 는 구독 요금제 전용) 상품 목록도 목데이터다
 * (`api/tokenProductApi`). 흐름은 시안(WF-021)대로 끝까지 이어 두고, **막히는 지점은
 * 확인창의 `결제하기` 한 곳**이다(`handleConfirm`).
 *
 * 페이지 CTA 를 잠그지 않은 이유: 그 버튼은 돈을 쓰지 않고 확인창을 열 뿐이다. 실제로
 * 청구가 일어날 자리에서만 멈추는 편이, 화면 전체가 죽어 있는 것보다 무엇이 준비 안 됐는지
 * 정확히 말한다.
 *
 * 서버가 생기면 `IS_TOKEN_PURCHASE_READY` 하나로 열린다.
 *
 * ⚠️ **`구매 후 보유 생성권` 은 시안이 요구하지만 지금 값의 근거가 반쪽이다.**
 * `GET /blog-drafts/usage` 는 월 한도 기준(`limit`/`usedCount`/`remainingCount`)이라
 * **이월되는 구매분을 담을 자리가 없다.** 지금은 `잔량 + 구매 수량` 으로 더해서 보여주되,
 * 잔량을 모르면 아예 줄을 비운다 — 더할 수 없는 값을 지어내지 않는다.
 */
export function TokenPurchasePage() {
  const goBack = useGoBack(ROUTES.profile);
  const { data: products, isPending, isError, refetch } = useTokenProducts();
  const { remaining, isPending: isBalancePending } = usePictreeToken();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { showToast } = useToast();

  /*
    기본 선택은 **가운데 상품**이다. 시안이 10회를 펴 둔 상태로 그려져 있고, 아무것도
    안 고른 채로 두면 요약표가 통째로 비어 화면이 고장 난 것처럼 보인다.

    목록이 도착한 뒤에 정해야 해서 `useEffect` 다. 사용자가 이미 고른 뒤에는 건드리지
    않는다 — 목록이 다시 오는 경우(재조회) 선택이 되돌아가면 안 된다.
  */
  useEffect(() => {
    if (selectedId !== null || !products || products.length === 0) return;
    setSelectedId(products[Math.floor(products.length / 2)].id);
  }, [products, selectedId]);

  const selected = products?.find((product) => product.id === selectedId) ?? null;

  /**
   * 확인창의 `결제하기`.
   *
   * ⚠️ **아직 결제되지 않는다.** 일회성 결제 주문 API 가 없어서(`api/tokenProductApi`)
   * 여기서 멈추고 그 사실을 그대로 알린다. 실패 토스트(`error`)가 아니라 `info` 인 것이
   * 중요하다 — 빨간 토스트는 사용자가 **자기 카드가 거절됐다**고 읽는다. 결제를 시도한
   * 적조차 없다는 것을 말해야 하는 자리다.
   *
   * 서버가 생기면 `IS_TOKEN_PURCHASE_READY` 가 켜지고 이 함수는 `purchaseTokens(id)` 를
   * 부르면 된다.
   */
  const handleConfirm = () => {
    setIsConfirming(false);

    if (!IS_TOKEN_PURCHASE_READY) {
      showToast('생성권 결제 기능을 준비 중이에요.', 'info');
      return;
    }
  };

  /** 구매 후 보유량. 잔량을 모르면 `null` — 위 ⚠️ 참고. */
  const balanceAfter =
    remaining !== null && selected !== null ? remaining + selected.quantity : null;

  return (
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      <header className="px-5 pt-header">
        <NavBar onBack={goBack} title="AI 초안 생성권 추가 구매" />
      </header>

      {isError ? (
        <div className="px-5 pt-6">
          <div className="rounded-xl border border-error bg-white px-5 py-4 text-center">
            <p className="text-[15px] text-error">상품을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col px-5 pt-6">
          {/*
            시안대로 가운데 정렬 세 줄이다. 첫 줄이 무엇을 하는 화면인지, 아래 두 줄이
            **무엇이 안 바뀌는지**를 말한다 — 이 화면에 닿는 사람이 가장 헷갈리는 지점이
            "이거 사면 플랜이 바뀌나" 라, 그 답을 맨 위에 둔다.
          */}
          <h1 className="text-center text-[17px] font-medium leading-[26px] text-ink">
            필요한 만큼만 추가로 구매하세요
            <br />
            구독 플랜을 변경하지 않고
            <br />
            AI 초안 생성권만 추가할 수 있습니다.
          </h1>

          {/* 수량 칩 — 셋이 폭을 나눠 갖는다. 개수가 늘어도 줄이 안 깨지게 `flex-1` 이다. */}
          <div className="mt-6 flex gap-2">
            {isPending
              ? [0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-[42px] flex-1 rounded-[21px]" />
                ))
              : products?.map((product) => (
                  <QuantityChip
                    key={product.id}
                    product={product}
                    isSelected={product.id === selectedId}
                    onSelect={() => setSelectedId(product.id)}
                  />
                ))}
          </div>

          {/*
            요약표. 고른 수량·현재 잔량·구매 후 보유량·금액 네 줄이다.

            값이 아직 없을 때 `-` 로 두고 자리는 유지한다 — 줄이 늦게 생기면 아래 고지와
            버튼이 통째로 밀린다.
          */}
          <div className="mt-5 overflow-hidden rounded-xl border border-pictree-300 bg-white">
            {/*
              머리 행. 시안에 있는 줄인데, 아래가 `이름 — 값` 표라는 걸 먼저 알려 준다.
              값이 전부 `n회` 로 끝나 세로로 훑으면 무엇의 개수인지 헷갈리기 쉬운 표다.
            */}
            <div className="flex items-center gap-4 border-b border-line-soft px-5 py-3">
              <span className="shrink-0 text-[15px] text-ink-muted">항목</span>
              <span className="min-w-0 flex-1 text-right text-[15px] text-ink-muted">
                표시 내용
              </span>
            </div>

            <SummaryRow label="AI 초안 생성권">
              {selected ? `${selected.quantity}회` : '-'}
            </SummaryRow>
            <SummaryRow label="현재 보유 생성권">
              {isBalancePending && remaining === null ? (
                <Skeleton surface="card" className="ml-auto h-[15px] w-12 rounded" />
              ) : remaining !== null ? (
                `${remaining}회`
              ) : (
                '-'
              )}
            </SummaryRow>
            <SummaryRow label="구매 후 보유 생성권">
              {balanceAfter !== null ? `${balanceAfter}회` : '-'}
            </SummaryRow>
            <SummaryRow label="결제 금액" emphasis>
              {selected ? formatPrice(selected.price) : '-'}
            </SummaryRow>
          </div>

          {/*
            고지. 일회성 상품이라는 것과 플랜이 그대로라는 것을 여기서 말한다 — 이 화면에
            닿는 사람이 가장 헷갈리는 지점이 "이거 사면 플랜이 바뀌나" 다.

            플랜 이름을 박지 않는다. 시안에는 `플러스 플랜` 이 적혀 있지만 화면에 오는
            사람이 어느 플랜인지는 서버가 정한다 — 이름을 박으면 무료 사용자에게도
            '플러스' 라고 말하게 된다(`planDisplay` 맨 위 "되돌리지 말 것"과 같은 태도).
          */}
          <ul className="mt-5 flex flex-col gap-1.5 text-[13px] leading-5 text-ink-muted">
            <li>· 추가 생성권은 한 번만 결제되는 상품입니다.</li>
            <li>· 현재 이용 중인 구독 플랜은 변경되지 않습니다.</li>
            <li>· 결제 완료 즉시 생성권이 추가됩니다.</li>
          </ul>

          {/*
            ⚠️ **이 버튼은 돈을 쓰지 않는다 — 확인창을 열 뿐이다.** 그래서 서버가 아직
            일회성 결제를 못 받아도 잠그지 않는다. 실제로 청구가 일어날 자리는 확인창의
            `결제하기` 이고, 막히는 것도 거기다(`handleConfirm`).
          */}
          <PrimaryCta className="mt-7" disabled={!selected} onClick={() => setIsConfirming(true)}>
            {selected ? `${formatPrice(selected.price)} 결제하기` : '수량을 선택해주세요'}
          </PrimaryCta>
        </div>
      )}

      {isConfirming && selected && (
        <TokenPurchaseConfirmModal
          product={selected}
          onConfirm={handleConfirm}
          onCancel={() => setIsConfirming(false)}
        />
      )}
    </div>
  );
}
