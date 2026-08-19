import { useEffect, useState } from 'react';

import { NavBar, PrimaryCta, Skeleton } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { ROUTES } from '@/shared/constants/routes';

import { usePictreeToken } from './hooks/usePictreeToken';
import { useTokenProducts } from './hooks/useTokenProducts';
import { IS_TOKEN_PURCHASE_READY } from './api/tokenProductApi';
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
 * 마이페이지의 줄, 그리고 블로그 생성 흐름에서 생성권을 다 썼을 때다.
 *
 * ⚠️⚠️ **결제 버튼이 잠겨 있다. 화면이 미완성이라서가 아니라 서버가 아직 못 받는다.**
 * 일회성 결제 주문 API 가 없다(지금 `POST /payment-orders` 는 구독 요금제 전용). 상품
 * 목록도 목데이터다(`api/tokenProductApi`). 눌러도 아무 일이 없거나 "준비 중" 토스트만
 * 뜨는 버튼을 두지 않는 이유는, 사용자가 그걸 **결제 실패로 읽기** 때문이다 — 잠그고
 * 버튼 글자로 이유를 말한다(`PrimaryCta` 주석의 규칙).
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
          <h1 className="text-[20px] font-medium leading-tight text-ink">
            필요한 만큼만 추가로 구매하세요
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-ink-muted">
            구독 플랜을 변경하지 않고
            <br />
            AI 초안 생성권만 추가할 수 있습니다.
          </p>

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
          <div className="mt-5 overflow-hidden rounded-xl border border-line-soft bg-white">
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

          <PrimaryCta
            className="mt-7"
            disabled={!IS_TOKEN_PURCHASE_READY || !selected}
            /*
              ⚠️ 지금은 닿지 않는 가지다(위 `disabled`). 서버가 생겼을 때 배선할 자리를
              비워 두지 않고 남긴다 — 빈 핸들러는 "이미 붙었는데 안 되는 것" 으로 읽힌다.
            */
            onClick={() => undefined}
          >
            {!IS_TOKEN_PURCHASE_READY
              ? '결제 준비 중이에요'
              : selected
                ? `${formatPrice(selected.price)} 결제하기`
                : '수량을 선택해주세요'}
          </PrimaryCta>
        </div>
      )}
    </div>
  );
}
