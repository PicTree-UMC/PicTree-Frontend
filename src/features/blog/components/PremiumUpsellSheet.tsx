import type { ComponentType } from 'react';
import { PrimaryCta, Sheet } from '@/shared/components';
import { useSubscriptionPlans } from '@/features/premium/hooks/useSubscriptionPlans';
import {
  FEATURE_CODE,
  featureLabel,
  featureValuesLabel,
  sortedFeatures,
} from '@/features/premium/lib/planDisplay';
import { AdOffIcon, BlogBenefitIcon, CheckIcon, CrownIcon, StorageUpgradeIcon } from './icons';

type PremiumUpsellSheetProps = {
  onClose: () => void;
  onUpgrade: () => void;
};

/**
 * 혜택 코드 → 아이콘. **줄 자체는 서버가 정한다** — 여기 없는 코드가 와도 줄은 그려지고
 * 아이콘 자리만 빈다. 혜택이 새로 생겨도 화면이 안 깨지게(§ `planDisplay` 의 ROW_ORDER 와 같은 태도).
 */
const FEATURE_ICON: Record<string, ComponentType> = {
  [FEATURE_CODE.photoStorage]: StorageUpgradeIcon,
  [FEATURE_CODE.aiBlogMonthly]: BlogBenefitIcon,
  [FEATURE_CODE.adFree]: AdOffIcon,
};

/** 값을 기다리는 동안 자리를 잡아 둔다 — 표가 늦게 오면서 시트 높이가 튀지 않게. */
function BenefitSkeleton() {
  return (
    <div className="flex min-h-[62px] items-center gap-3">
      <span className="h-6 w-6 shrink-0 animate-pulse rounded bg-cream-sub" />
      <span className="flex-1">
        <span className="block h-4 w-24 animate-pulse rounded bg-cream-sub" />
        <span className="mt-1 block h-3 w-16 animate-pulse rounded bg-cream-sub" />
      </span>
    </div>
  );
}

/**
 * 이번 주기 PICTREE 토큰을 다 썼을 때 뜨는 시트.
 *
 * ⚠️ **'프리미엄 기능이라 못 쓴다' 가 아니다.** 무료 플랜도 토큰을 월 1개 받으므로 기능
 * 자체는 누구나 쓴다 — 여기 닿는 사람은 그 몫을 이미 쓴 사람이다.
 *
 * ⚠️ **혜택 숫자를 박지 않는다.** 한때 `월 5회/20회/50회` · `1GB/5GB/20GB` 가 문자열로
 * 들어 있었는데, 그 표에는 **무료 플랜의 월 1회가 아예 없었다.** 값은 `GET /subscription-plans`
 * 에서만 온다(`planDisplay` 맨 위의 "되돌리지 말 것").
 */
export function PremiumUpsellSheet({ onClose, onUpgrade }: PremiumUpsellSheetProps) {
  const { data: plans, isPending } = useSubscriptionPlans();

  /*
    유료 플랜만 늘어놓는다 — 무료는 지금 쓰고 있는 것이라 '올리면 는다' 의 대상이 아니다.
    `useSubscriptionPlans` 가 가격 오름차순으로 주므로 마지막이 가장 비싼 플랜이고,
    혜택 줄은 그쪽 것을 쓴다(혜택을 가장 많이 켜 둔 플랜이라 빠지는 줄이 없다).
  */
  const paidPlans = (plans ?? []).filter((plan) => plan.price > 0);
  const rows = paidPlans.length > 0 ? sortedFeatures(paidPlans[paidPlans.length - 1]) : [];

  return (
    /*
      z 를 60 으로 올린다 — 이 시트는 하단 탭바(z-40) 위에 뜨는 블로그 탭의 FAB 에서 열린다.
      클래스가 아니라 프롭인 이유는 `Sheet` 주석 참고(Tailwind 임의값 우선순위 문제).
    */
    <Sheet
      onClose={onClose}
      label="PICTREE 토큰 소진"
      handleSize="grip"
      handleColor="#D9D9D9"
      z={60}
      className="rounded-t-[20px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      contentClassName="px-5"
    >
      <div className="flex justify-center text-ink">
        <CrownIcon large />
      </div>

      <h2 className="mt-3 text-center text-xl font-medium text-ink">토큰을 다 썼어요</h2>
      {/* 다음 주기에 채워지는 걸 숨기지 않는다 — 업그레이드만 말하면 기다리면 되는 사람에게
          결제가 유일한 길인 것처럼 읽힌다. `지금` 이 그 차이를 진다. */}
      <p className="mt-2 text-center text-[15px] leading-[21px] text-ink">
        이번 주기 PICTREE 토큰을 다 썼어요
        <br />
        플랜을 올리면 지금 더 쓸 수 있어요
      </p>

      {/* 흰 바닥으로 옮겨 오면서 안쪽 카드는 테두리로만 선다 — 흰 위의 흰 면은 안 보인다. */}
      <div className="mt-5 rounded-xl border-2 border-pictree-300 px-5 py-2">
        {isPending
          ? [0, 1, 2].map((key) => <BenefitSkeleton key={key} />)
          : rows.map((feature) => {
              const value = featureValuesLabel(paidPlans, feature.code);
              // 아무 유료 플랜도 안 켠 혜택은 줄째로 뺀다 — 빈 값은 '없다' 로 읽힌다.
              if (!value) return null;

              const Icon = FEATURE_ICON[feature.code];
              return (
                <div key={feature.code} className="flex min-h-[62px] items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center">
                    {Icon && <Icon />}
                  </span>
                  <span className="flex-1">
                    <strong className="block text-[15px] font-medium text-ink">
                      {featureLabel(feature)}
                    </strong>
                    <small className="text-[13px] text-ink-muted">{value}</small>
                  </span>
                  <CheckIcon />
                </div>
              );
            })}
      </div>

      <PrimaryCta onClick={onUpgrade} className="mt-4">
        플랜 업그레이드
      </PrimaryCta>
      <button type="button" className="mt-3 w-full py-2 text-[13px] text-ink-muted" onClick={onClose}>
        나중에 할게요
      </button>
    </Sheet>
  );
}
