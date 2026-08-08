import { FEATURE_CODE, findFeature } from '../lib/planDisplay';
import { useMySubscription } from './useMySubscription';
import { useSubscriptionPlans } from './useSubscriptionPlans';

/**
 * PICTREE 토큰 = `AI_BLOG_MONTHLY`. 새 기능이 아니라 **같은 값의 다른 이름**이다
 * (`lib/planDisplay` 의 `featureLabel` 이 그 이름표를 정한다).
 */
export interface PictreeTokenBalance {
  /** 이번 달 한도(회). 요금제를 아직 못 받았으면 `null`. */
  monthlyLimit: number | null;
  /** 이번 달 쓴 횟수. 서버에 사용량 API 가 없어 **지금은 항상 `null`**. */
  used: number | null;
  /** 남은 횟수. `used` 를 모르면 `null` — 지어내지 않는다. */
  remaining: number | null;
  /** 요금제를 불러오는 중. 한도 자리에 스켈레톤을 그릴지 판단한다. */
  isPending: boolean;
}

/**
 * 이번 달 사용량.
 *
 * ⚠️ **서버에 이 값을 주는 API 가 없다.** 그래서 `null` 을 돌려주고, 화면은 잔량 대신
 * 한도만 말한다("월 5회 제공"). 값이 생기면 여기만 고치면 잔량 문구가 저절로 켜진다
 * (`ProfileSummary` 가 `remaining` 유무로 갈라 그린다).
 *
 * **초안 목록(`GET /blog-drafts`)으로 세면 안 된다.** 두 군데서 어긋난다 —
 *  1. 생성(`POST /blog-drafts/generate`)과 저장(`POST /blog-drafts`)이 별개다. 생성만
 *     하고 저장하지 않으면 목록에 안 남는데 토큰은 이미 썼다.
 *  2. 초안을 지우면 목록에서 사라져 잔량이 되살아난 것처럼 보인다.
 *
 * 둘 다 **실제보다 많이 남은 것처럼** 보이게 하는 방향이라, 사용자는 쓰려는 순간에야
 * 틀렸다는 걸 안다. 필요한 건 `GET /subscriptions/me` 에 이번 달 사용량 필드를 얹거나
 * 사용량 전용 엔드포인트를 두는 것 — 백엔드에 요청해 둘 것.
 */
const usedThisMonth = (): number | null => null;

const remainingOf = (limit: number | null, used: number | null): number | null =>
  limit === null || used === null ? null : Math.max(0, limit - used);

/**
 * PICTREE 토큰 잔량 조회 훅.
 *
 * 한도는 **내 요금제의 혜택**에서 뽑는다. `GET /subscriptions/me` 의 `plan` 은
 * 요약(`SubscriptionPlanSummary`)이라 `features[]` 가 없어서, 코드로 `GET
 * /subscription-plans` 의 전체 요금제를 찾아 혜택을 읽는다.
 *
 * 화면에 회수를 박지 않는다 — 값은 서버가 정한다(`lib/planDisplay` 맨 위 주석).
 */
export const usePictreeToken = (): PictreeTokenBalance => {
  const { data: subscription } = useMySubscription();
  const { data: plans, isPending } = useSubscriptionPlans();

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
  const monthlyLimit = feature ? (feature.isEnabled ? feature.limitValue : 0) : null;

  const used = usedThisMonth();

  return {
    monthlyLimit,
    used,
    remaining: remainingOf(monthlyLimit, used),
    isPending,
  };
};
