import { useBlogDraftUsage } from '@/features/blog/hooks/useBlogDraftUsage';

import { FEATURE_CODE, findFeature } from '../lib/planDisplay';
import { useMySubscription } from './useMySubscription';
import { useSubscriptionPlans } from './useSubscriptionPlans';

/**
 * PICTREE 토큰 = `AI_BLOG_MONTHLY`. 새 기능이 아니라 **같은 값의 다른 이름**이다
 * (`lib/planDisplay` 의 `featureLabel` 이 그 이름표를 정한다).
 */
export interface PictreeTokenBalance {
  /** 이번 주기 한도(회). 아직 아무것도 못 받았으면 `null`. */
  monthlyLimit: number | null;
  /** 이번 주기에 쓴 횟수. 사용량을 못 받았으면 `null`. */
  used: number | null;
  /** 남은 횟수. `used` 를 모르면 `null` — 지어내지 않는다. */
  remaining: number | null;
  /** 값을 불러오는 중. 한도 자리에 스켈레톤을 그릴지 판단한다. */
  isPending: boolean;
}

/**
 * PICTREE 토큰 잔량 조회 훅.
 *
 * 잔량은 **`GET /blog-drafts/usage`** 가 유일한 출처다. 한때 이 값이 없어 화면이 잔량
 * 대신 한도만 말했는데(`월 5회 제공`), 그때 적어 둔 조건 — 생성과 저장이 별개고 초안을
 * 지워도 소모는 안 되돌아온다 — 을 서버가 별도 사용 원장으로 그대로 만족시킨다.
 *
 * ⚠️ **한도도 사용량 API 값을 먼저 쓴다.** 요금제 혜택(`AI_BLOG_MONTHLY`)과 서버가
 * 실제로 강제하는 한도(`BLOG_DRAFT_LIMIT` 상수)가 서로 다른 출처라 어긋날 수 있는데,
 * 사용자가 실제로 몇 번 더 쓸 수 있는지를 정하는 건 후자다. 혜택값은 사용량을 못
 * 받았을 때의 폴백으로만 남긴다 — 그래야 이 API 가 실패해도 "월 n회" 표기는 지킨다.
 *
 * 화면에 회수를 박지 않는다 — 값은 서버가 정한다(`lib/planDisplay` 맨 위 주석).
 */
export const usePictreeToken = (): PictreeTokenBalance => {
  const { data: subscription } = useMySubscription();
  const { data: plans, isPending: isPlansPending } = useSubscriptionPlans();
  const { data: usage, isPending: isUsagePending } = useBlogDraftUsage();

  /**
   * ⚠️ `subscription` 만으로 유·무료를 가르지 않는다. 구독한 적 없는 사용자에게도
   * 서버가 `plan` 을 채워 주므로(무료), 여기서는 **어느 요금제의 혜택을 읽을지**만
   * 정하면 된다. 못 받았으면 무료로 본다.
   */
  const planCode = subscription?.plan.code ?? 'FREE';
  const plan = plans?.find((p) => p.code === planCode);
  const feature = plan ? findFeature(plan, FEATURE_CODE.aiBlogMonthly) : undefined;

  /**
   * 혜택이 꺼져 있으면(`isEnabled: false`) 한도는 0 이다 — `null`(모름)과 구분한다.
   * 무료 플랜이 AI 블로그를 아예 못 쓰는 경우가 여기 걸린다.
   */
  const featureLimit = feature ? (feature.isEnabled ? feature.limitValue : 0) : null;

  return {
    monthlyLimit: usage?.limit ?? featureLimit,
    used: usage?.usedCount ?? null,
    // 서버가 이미 `max(limit - usedCount, 0)` 으로 계산해 준다 — 다시 빼지 않는다.
    remaining: usage?.remainingCount ?? null,
    /*
      둘 중 하나라도 오면 그릴 게 생긴다. 사용량이 먼저 와도 한도는 그 안에 들어 있고,
      요금제가 먼저 와도 한도만큼은 말할 수 있다.
    */
    isPending: isPlansPending && isUsagePending,
  };
};
