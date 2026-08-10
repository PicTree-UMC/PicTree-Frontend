import type { ReactNode } from 'react';
import { Chip } from '@/shared/components';
import {
  FEATURE_CODE,
  featureLabel,
  findFeature,
  formatFeatureValue,
  planPriceLabel,
  planSummary,
  sortedFeatures,
} from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * 서버 혜택이 아니다 — 요금제와 무관하게 무제한이라 `/subscription-plans` 에 안 들어있다.
 * 그래도 비교표에 남긴다: 무료로 어디까지 되는지가 유료 전환 판단의 절반이라, "기록 자체는
 * 원래 무제한" 이라는 사실이 빠지면 표가 실제보다 인색해 보인다. 서버에 생기면 이 상수를 지운다.
 */
const STATIC_ROW = { label: '타임라인 · 동선 저장', free: '무제한', paid: '무제한' };

type Props = {
  freePlan: SubscriptionPlanDto;
  paidPlans: SubscriptionPlanDto[];
  selectedId: number;
  onSelect: (id: number) => void;
  /**
   * 표 아래에 붙는 결제 버튼(`PlanCheckoutButton`). 이 섹션 안에 들어와야 한다 —
   * 칩·표·버튼이 같은 선택 하나를 보고 움직이는데 버튼만 섹션 밖에 있으면
   * 40px(`gap-10`) 떨어져 다른 묶음으로 읽힌다.
   *
   * 버튼 자체를 여기서 그리지 않는 이유는 구독 상태(`useMySubscription`)를 알아야
   * '이용 중' 을 판단할 수 있어서다. 이 컴포넌트는 요금제만 받아 그리는 자리로 둔다.
   */
  children?: ReactNode;
};

/**
 * 무료 ↔ 고른 유료 플랜을 나란히 놓는 비교표 + 그 아래 결제 버튼.
 *
 * **피커바가 이 페이지의 유일한 플랜 선택기다.** 한때는 소개 카드의 CTA 로도 플랜을
 * 정할 수 있었는데, 두 선택이 서로를 몰라서 표에 편 플랜과 실제 결제 대상이 어긋날 수
 * 있었다. 지금은 여기서 고른 것이 표와 버튼을 동시에 바꾼다.
 *
 * **한 번에 두 열만 보여준다.** 종전 `BenefitTable` 은 유료 열 하나에 전 플랜을 범위로
 * 접어 넣었는데('1GB~20GB', '월 5~50회'), 범위는 어느 플랜이 그 값을 주는지를 말해주지
 * 않는다 — 고르는 데 쓸 수 없는 숫자다. 유료 플랜을 전부 열로 펼치는 방법도 있지만 390px
 * 폭에 3열이 들어가면 값이 두 줄로 접힌다. 그래서 피커로 갈아끼운다.
 *
 * 줄은 무료 플랜의 혜택 목록을 기준으로 만든다. 유료에만 있는 코드는 안 그려지는데,
 * 지금 서버는 세 플랜이 같은 코드 집합(용량·AI 블로그·광고)을 쓴다.
 */
export function PlanComparison({
  freePlan,
  paidPlans,
  selectedId,
  onSelect,
  children,
}: Props) {
  const selected = paidPlans.find((p) => p.id === selectedId) ?? paidPlans[0];
  if (!selected) return null;

  const rows = sortedFeatures(freePlan)
    /*
      광고 제거 줄은 뺐다 — 그 자리를 가격이 가져갔다. 세 혜택 중 유일한 참/거짓 값이라
      다른 줄들처럼 '얼마나 늘어나는지' 를 말하지 못하고, 표에서 유료 전환의 근거로는
      가장 약한 줄이었다. ⚠️ 그래서 광고 제거는 이제 페이지 어디에도 안 나온다 —
      되살릴 거라면 이 필터를 지우고 가격 줄은 아래에 그대로 두면 된다.
    */
    .filter((feature) => feature.code !== FEATURE_CODE.adFree)
    .map((feature) => ({
      // 서버 `name` 이 아니라 `featureLabel` — 'AI 블로그 생성' 을 'PICTREE 토큰' 으로
      // 부른다. 값(월 몇 회)은 그대로 서버에서 온다.
      label: featureLabel(feature),
      free: formatFeatureValue(feature),
      paid: formatFeatureValue(findFeature(selected, feature.code)),
    }));
  rows.splice(1, 0, STATIC_ROW); // 사진 용량 바로 아래
  /*
    가격은 맨 아래 — 혜택을 다 읽은 뒤에 오는 결론이고, 바로 밑에 붙는 결제 버튼과
    이어진다. 서버 값에서 파생하는 줄이라 `STATIC_ROW` 와 달리 지울 대상이 아니다.
  */
  rows.push({
    label: '가격',
    free: planPriceLabel(freePlan),
    paid: planPriceLabel(selected),
  });

  return (
    <section>
      {/*
        섹션 제목 21px(종전 17px). 표 안 글자가 15px 이라 17px 은 겨우 두 단계 커서
        섹션이 시작된다는 신호가 서지 않았다.

        **가운데 정렬이다**(참고: 유튜브 프리미엄). 이 페이지는 목록을 훑는 화면이 아니라
        표지에서 시작해 아래로 읽어 내려가는 화면이고, 히어로·혜택 문구가 이미 가운데라
        여기만 왼쪽에 붙으면 시선의 축이 중간에 꺾인다. 앱의 다른 화면들이 제목을 왼쪽에
        두는 것과 다른 이유가 이것이다 — 그쪽은 훑는 목록이다.
      */}
      <h2 className="mt-8 text-center text-[21px] font-medium text-[#2C3930]">
        내게 맞는 플랜을
        <br/>
        찾아보세요
      </h2>

      {/*
        피커바. 라디오 그룹이라 Chip 에 role/aria-checked 를 직접 넘긴다(§5) —
        `selected` 만 넘기면 aria-pressed 가 붙어 토글로 낭독된다.
        플랜이 늘어도 390px 안에서 버티도록 가로 스크롤.

        ⚠️ 가운데 정렬은 `justify-center` 가 아니라 **`safe center`** 다. 제목이 가운데로
        오면서 칩도 따라와야 하는데, 스크롤되는 줄에 그냥 `justify-center` 를 걸면 내용이
        넘칠 때 **왼쪽으로 넘친 칩에 스크롤로 닿을 수 없다**(flex 가 시작 지점을 음수로
        밀어낸다). `safe` 는 넘치는 순간 start 정렬로 되돌아가서, 지금(3개)은 가운데에
        놓이고 플랜이 늘면 알아서 왼쪽부터 스크롤된다.
      */}
      <div
        role="radiogroup"
        aria-label="비교할 플랜"
        className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 [justify-content:safe_center] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {paidPlans.map((plan) => {
          const isActive = plan.id === selected.id;
          return (
            <Chip
              key={plan.id}
              tone="outline"
              selected={isActive}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(plan.id)}
            >
              {planSummary(plan).shortName}
            </Chip>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line-soft bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-line-soft px-4 py-3 text-[13px] text-[#60655C]">
          <span>혜택</span>
          <span className="text-center">무료</span>
          <span className="text-center text-pictree-700">{planSummary(selected).shortName}</span>
        </div>

        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3.5 text-[15px] ${
              i > 0 ? 'border-t border-line-soft' : ''
            }`}
          >
            <span className="text-[#2C3930]">{row.label}</span>
            {/*
              무료 열을 흐리게 하지 않는다 — 비교 대상이지 비활성이 아니다(§5 의 칩 규칙과 같은 이유).
              차이는 유료 열에 색을 주는 쪽으로만 낸다.
            */}
            <span className="text-center text-[#60655C]">{row.free}</span>
            <span className="text-center font-medium text-pictree-700">{row.paid}</span>
          </div>
        ))}
      </div>

      {children}
    </section>
  );
}
