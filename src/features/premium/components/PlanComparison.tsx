import type { ReactNode } from 'react';
import { Chip } from '@/shared/components';
import { formatKoreanMonthDay } from '@/shared/lib/date';
import {
  FEATURE_CODE,
  featureLabel,
  findFeature,
  formatFeatureValue,
  formatPrice,
  planAmountLabel,
  planPriceRowLabel,
  planSummary,
  sortedFeatures,
} from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * 서버 혜택이 아니다 — 요금제와 무관하게 무제한이라 `/subscription-plans` 에 안 들어있다.
 * 그래도 비교표에 남긴다: 무료로 어디까지 되는지가 유료 전환 판단의 절반이라, "기록 자체는
 * 원래 무제한" 이라는 사실이 빠지면 표가 실제보다 인색해 보인다. 서버에 생기면 이 상수를 지운다.
 *
 * ⚠️ **플랜 변경 맥락에서는 안 그린다.** 유료 ↔ 유료를 견주는 표에서는 양쪽이 다 '무제한'
 * 이라 아무것도 말하지 않는 줄이 되고, 시안의 변경 프레임에도 이 줄이 없다. 위 근거는
 * "무료로 어디까지 되나" 였으므로 무료 열이 있을 때만 성립한다.
 */
const STATIC_ROW = { label: '타임라인 · 동선 저장', free: '무제한', paid: '무제한' };

/** 플랜 변경 맥락. 값이 있으면 헤더가 '현재/변경 후' 로 바뀌고 줄이 붙는다. */
export type PlanChangeContext = {
  /** 업그레이드냐 다운그레이드냐. 붙는 줄과 값이 여기서 갈린다. */
  direction: 'upgrade' | 'downgrade';
  /** 변경이 적용되는 시점 = 다음 결제일. 없으면 날짜를 지어내지 않고 문장만 바꾼다. */
  effectiveAt: string | null;
  /** 업그레이드일 때 오늘 청구되는 차액(원). 계산이 안 되면 `null`. */
  chargeAmount: number | null;
};

type Props = {
  /**
   * 왼쪽 열 — 견줄 **기준** 플랜.
   *
   * ⚠️ 종전엔 `freePlan` 으로 못 박혀 있었다. 그래서 이미 플러스를 쓰는 사람이 프로를
   * 골라도 표가 `무료 | 프로` 를 그렸고, 정작 알아야 할 '지금 것과 무엇이 다른가' 는
   * 화면 어디에도 없었다. 무엇을 넘길지는 부르는 쪽이 정한다(`PremiumPage`).
   */
  basePlan: SubscriptionPlanDto;
  paidPlans: SubscriptionPlanDto[];
  selectedId: number;
  onSelect: (id: number) => void;
  /** 플랜 변경 맥락이면 채운다. 미구독이거나 지금 쓰는 플랜을 고른 상태면 `null`. */
  planChange?: PlanChangeContext | null;
  /**
   * 칩 줄 바로 아래에 붙는 것(`PendingPlanChangeNotice`). 예약 배지는 **표를 읽기 전에**
   * 보여야 한다 — 표가 말하는 '지금 플랜' 위에 이미 다른 예약이 걸려 있다는 전제라서다.
   */
  notice?: ReactNode;
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
 * 기준 플랜 ↔ 고른 유료 플랜을 나란히 놓는 비교표 + 그 아래 결제 버튼.
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
 * 줄은 기준 플랜의 혜택 목록을 기준으로 만든다. 고른 플랜에만 있는 코드는 안 그려지는데,
 * 지금 서버는 네 플랜이 같은 코드 집합(용량·AI 블로그·광고)을 쓴다.
 */
export function PlanComparison({
  basePlan,
  paidPlans,
  selectedId,
  onSelect,
  planChange,
  notice,
  children,
}: Props) {
  const selected = paidPlans.find((p) => p.id === selectedId) ?? paidPlans[0];
  if (!selected) return null;

  const isChanging = Boolean(planChange);

  const rows = sortedFeatures(basePlan)
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
  if (!isChanging) rows.splice(1, 0, STATIC_ROW); // 사진 용량 바로 아래
  /*
    이용료는 혜택 줄 다음 — 혜택을 다 읽은 뒤에 오는 결론이고, 바로 밑에 붙는 결제 버튼과
    이어진다. 서버 값에서 파생하는 줄이라 `STATIC_ROW` 와 달리 지울 대상이 아니다.
  */
  rows.push({
    label: planPriceRowLabel(selected),
    free: planAmountLabel(basePlan),
    paid: planAmountLabel(selected),
  });

  if (planChange) {
    /*
      업그레이드는 남은 기간 비례 차액, 다운그레이드는 0원(`lib/planProration`).
      `planAmountLabel` 이 아니다 — 저건 0원을 '무료' 로 접는데, 여기서 하려는 말은
      '이 플랜이 공짜다' 가 아니라 '오늘 빠져나가는 돈이 없다' 다.
    */
    rows.push({
      label: '오늘 결제',
      free: '-',
      paid: formatPrice(
        planChange.direction === 'upgrade' ? (planChange.chargeAmount ?? 0) : 0,
      ),
    });

    /*
      ⚠️ **`적용 시점` 은 다운그레이드에만 붙는다**(#325 시안). 업그레이드는 결제 즉시
      적용이라 '언제부터' 가 질문이 안 되고, 그 사실은 CTA(`5,000원 결제하고 변경`)와
      확인 모달이 이미 말한다.

      ⚠️ 해를 뺀 '9월 15일부터' 다(`formatKoreanMonthDay`). 표의 값 열은 `1fr` 두 칸이라
      390px 에서 한 칸이 ~98px 인데, `2026년 9월 15일부터` 는 거기서 두 줄로 접혀 이 줄만
      키가 커진다. 예약은 길어야 한 결제 주기 뒤라 연도가 정보를 더하지도 않는다 —
      확인 모달처럼 자리가 넉넉한 곳에서만 해를 붙인다.
    */
    if (planChange.direction === 'downgrade') {
      const effectiveLabel = formatKoreanMonthDay(planChange.effectiveAt);
      rows.push({
        label: '적용 시점',
        free: '현재 이용 중',
        paid: effectiveLabel ? `${effectiveLabel}부터` : '다음 결제일부터',
      });
    }
  }

  const baseHeader = isChanging ? `현재 ${planSummary(basePlan).shortName}` : '무료';
  const selectedHeader = isChanging
    ? `변경 후 ${planSummary(selected).shortName}`
    : planSummary(selected).shortName;

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
      <h2 className="mt-8 text-center text-[21px] font-medium text-ink">
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

      {/*
        예약 배지 자리. 제목·칩이 가운데 축이라 배지도 따라간다 — 왼쪽에 붙으면 칩 줄과
        다른 묶음으로 읽힌다.

        ⚠️ 감싸개에 여백을 주지 않는다(`mt-3` 는 배지 자신이 든다). 예약이 없으면
        `PendingPlanChangeNotice` 가 `null` 을 돌려주는데, 그때 이 div 가 여백을 들고
        있으면 **아무것도 없는 자리가 12px 벌어진다.** 빈 div 는 높이가 0이다.
      */}
      <div className="flex justify-center">{notice}</div>

      {/*
        ⚠️ `break-keep`(word-break: keep-all) 은 표 전체에 건다. 값 열이 `1fr` 두 칸이라
        320px 에서 한 칸이 ~82px 인데, 기본값에서 브라우저는 한글을 글자 단위로 끊어서
        `9월 15일부 / 터` 처럼 낱말 가운데가 갈렸다. keep-all 이면 띄어쓰기에서만 끊긴다 —
        좁은 폭에서 줄이 하나 늘 수는 있어도 낱말이 쪼개지지는 않는다.
      */}
      <div className="mt-4 overflow-hidden break-keep rounded-2xl border border-line-soft bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-line-soft px-4 py-3 text-[13px] text-ink-muted">
          <span>혜택</span>
          <span className="text-center">{baseHeader}</span>
          <span className="text-center text-pictree-700">{selectedHeader}</span>
        </div>

        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3.5 text-[15px] ${
              i > 0 ? 'border-t border-line-soft' : ''
            }`}
          >
            <span className="text-ink">{row.label}</span>
            {/*
              기준 열을 흐리게 하지 않는다 — 비교 대상이지 비활성이 아니다(§5 의 칩 규칙과 같은 이유).
              차이는 고른 플랜 열에 색을 주는 쪽으로만 낸다.
            */}
            <span className="text-center text-ink-muted">{row.free}</span>
            <span className="text-center font-medium text-pictree-700">{row.paid}</span>
          </div>
        ))}
      </div>

      {children}
    </section>
  );
}
