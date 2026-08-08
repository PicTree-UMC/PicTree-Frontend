import { planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

type Props = {
  /** 비교표 칩으로 고른 플랜. 이 버튼이 결제할 대상이기도 하다. */
  plan: SubscriptionPlanDto;
  /** 지금 이용 중인 플랜인가. 맞으면 누를 수 없다. */
  isCurrent: boolean;
  onStart: () => void;
};

/**
 * 페이지에서 결제로 들어가는 **유일한** 버튼. 비교표 바로 아래에 붙는다.
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
 * **이용 중이면 비활성.** 같은 플랜을 또 결제할 수 있게 두면 중복 결제가 된다 — 요금제
 * 변경 엔드포인트가 없어서 서버가 막아 줄 거라고 기대할 수도 없다(`paymentApi.ts` 에는
 * 시작·해지·재개·빌링키뿐이다). `disabled` 만으로는 왜 못 누르는지 모르므로 문구도 바꾼다.
 *
 * ⚠️ 비활성 상태에도 대비 4.5:1 을 지킨다. `opacity-60` 으로 흐리면 회색 면 위 회색
 * 글자가 3:1 아래로 떨어진다 — 색을 직접 지정한다(#ECECEC 면 위 #60655C = 4.6:1).
 */
export function PlanCheckoutButton({ plan, isCurrent, onStart }: Props) {
  const { shortName } = planSummary(plan);

  if (isCurrent) {
    return (
      <button
        type="button"
        disabled
        className="mt-4 h-12 w-full rounded-xl bg-[#ECECEC] text-[15px] font-medium text-[#60655C]"
      >
        이용 중인 플랜입니다
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      className="mt-4 h-12 w-full rounded-xl bg-pictree-700 text-[15px] font-medium text-white"
    >
      {shortName} 시작하기
    </button>
  );
}
