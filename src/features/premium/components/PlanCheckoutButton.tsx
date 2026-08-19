import { planSummary } from '../lib/planDisplay';
import type { PlanAction } from '../lib/planAction';
import type { SubscriptionPlanDto } from '../types/payment';

type Props = {
  /** 비교표 칩으로 고른 플랜. 이 버튼이 결제하거나 예약할 대상이기도 하다. */
  plan: SubscriptionPlanDto;
  /** 이 플랜에 대해 지금 할 수 있는 일. `lib/planAction` 이 정한다. */
  action: PlanAction;
  /** 미구독 → 결제 시트를 연다. */
  onStart: () => void;
  /** 구독 중 다른 플랜 → 변경 예약 확인 모달을 연다. */
  onChange: () => void;
};

/**
 * 페이지에서 결제·변경으로 들어가는 **유일한** 버튼. 비교표 바로 아래에 붙는다.
 *
 * **왜 여기 하나인가.** 종전엔 소개 카드마다 CTA 가 있었다. 그러면 카드에서 한 번,
 * 비교표 칩에서 또 한 번 플랜을 고르게 되는데 **두 선택이 서로를 모른다** — 비교표에서
 * '프로' 를 펴 놓고 위로 올라가 '플러스' 카드의 버튼을 누르는 일이 생긴다. 고르는 자리를
 * 칩 하나로 합치고, 그 선택이 표와 버튼을 동시에 바꾸게 했다. 지금 화면에 보이는 표가 곧
 * 지금 살 것이다.
 *
 * **라벨에 가격은 안 적는다.** 한때 `· 월 2,900원` 을 붙였는데, 그 뒤 비교표 맨 아래
 * 줄이 '가격' 이 되면서 버튼 바로 위에 같은 금액이 놓였다. 두 뼘 사이에 같은 값이 두 번
 * 나오면 서로를 확인해 주는 게 아니라 어느 쪽이 진짜인지 되짚게 만든다. 금액은 표가,
 * 행동은 버튼이 맡는다.
 *
 * ⚠️ **종전에는 갈래가 둘뿐이었다** — '이용 중' 이면 비활성, 아니면 무조건 '시작하기'.
 * 그래서 플러스 구독자가 맥스를 고르면 `POST /subscriptions`(구독 **시작**)가 나갔고,
 * 서버가 409 로 막았다. 이중결제는 안 났지만 화면에는 "카드 상태를 확인해 주세요" 가
 * 떴다 — 카드를 바꿔도 안 되는 길이었다. 지금은 `plan-change` 로 간다.
 *
 * ⚠️ 비활성 상태에도 대비 4.5:1 을 지킨다. `opacity-60` 으로 흐리면 회색 면 위 회색
 * 글자가 3:1 아래로 떨어진다 — 색을 직접 지정한다(LINE-soft 면 위 #60655C = 4.6:1).
 */
export function PlanCheckoutButton({ plan, action, onStart, onChange }: Props) {
  const { shortName } = planSummary(plan);

  const enabledClass =
    'mt-4 h-12 w-full rounded-xl bg-pictree-700 text-[15px] font-medium text-white';
  const disabledClass =
    'mt-4 h-12 w-full rounded-xl bg-line-soft text-[15px] font-medium text-ink-muted';

  if (action === 'start') {
    return (
      <button type="button" onClick={onStart} className={enabledClass}>
        {shortName} 시작하기
      </button>
    );
  }

  if (action === 'change') {
    /*
      '시작하기' 가 아니라 '변경 예약' 이다. 돈이 지금 나가지 않으므로 결제 낱말을 쓰면 안
      된다 — 실제로 일어나는 일은 다음 결제일에 적용될 요금제를 바꿔 두는 것뿐이다.

      **'변경' 에서 '변경 예약' 으로 늘렸다**(#325 시안). 표 맨 아래 두 줄이 이미
      `오늘 결제 0원` · `적용 시점 9월 15일부터` 라 버튼만 '변경' 이면 그 둘과 어긋나
      읽힌다. 예약이라는 사실은 확인 모달까지 가지 말고 버튼에서 끝나야 한다.

      ⚠️ 시안의 업그레이드 라벨(`1,300원 결제하고 변경`)은 아직 못 쓴다 — 차액을 계산해
      주는 API 도, 즉시 적용해 주는 엔드포인트도 서버에 없다(2026-08-19 스웨거 확인).
      지금 서버에서 업/다운 어느 쪽이든 일어나는 일은 예약 하나뿐이라, 방향을 갈라 봐야
      두 갈래가 같은 말을 하게 된다. API 가 생기면 그때 `resolvePlanAction` 에 갈래를 낸다.
    */
    return (
      <button type="button" onClick={onChange} className={enabledClass}>
        {shortName}(으)로 변경 예약
      </button>
    );
  }

  /*
    비활성 넷. `disabled` 만으로는 왜 못 누르는지 모르므로 문구가 사유를 말한다 —
    특히 `blocked-*` 둘은 **다음에 뭘 하면 되는지**까지 말해야 막다른 길이 아니게 된다.
  */
  const disabledLabel: Record<Exclude<PlanAction, 'start' | 'change'>, string> = {
    current: '이용 중인 플랜입니다',
    pending: '변경이 예약된 플랜입니다',
    'blocked-canceled': '자동갱신을 먼저 켜주세요',
    'blocked-pending': '예약된 변경을 먼저 취소해주세요',
  };

  return (
    <button type="button" disabled className={disabledClass}>
      {disabledLabel[action]}
    </button>
  );
}
