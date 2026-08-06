import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { NavBar, useToast } from "@/shared/components";
import { formatKoreanDate } from "@/shared/lib/date";
import { useMySubscription } from "../premium/hooks/useMySubscription";
import { useSubscriptionPlans } from "../premium/hooks/useSubscriptionPlans";
import { useBillingKeys } from "../premium/hooks/useBillingKeys";
import {
  useCancelSubscription,
  useResumeSubscription,
} from "../premium/hooks/useSubscriptionActions";
import { FEATURE_CODE, findFeature, planSummary } from "../premium/lib/planDisplay";
import type { PlanFeatureDto } from "../premium/types/payment";
import { getShortPlanName, getStorageLimitBytes, isFreePlan } from "./lib/plan";
import { formatBytes } from "./lib/formatBytes";
import { PlanBadge } from "./components/PlanBadge";
import { StorageCard } from "./components/StorageCard";
import { useStorageUsage } from "./hooks/useStorageUsage";
import { CancelSubscriptionModal } from "./components/CancelSubscriptionModal";
import cardIcon from "./assets/icons/card.svg";
import checkIcon from "./assets/icons/check.svg";
import gisRouteIcon from "./assets/icons/gisRoute.svg";
import menuBookIcon from "./assets/icons/menuBook.svg";
import adsOffIcon from "./assets/icons/adsoff.svg";

const BENEFIT_ICON: Record<string, string> = {
  [FEATURE_CODE.photoStorage]: gisRouteIcon,
  [FEATURE_CODE.aiBlogMonthly]: menuBookIcon,
  [FEATURE_CODE.adFree]: adsOffIcon,
};

/** 시안(WF-017) 순서. 서버 features[] 는 코드 알파벳순이라 그대로 쓰면 어긋난다. */
const BENEFIT_ORDER = [
  FEATURE_CODE.photoStorage,
  FEATURE_CODE.aiBlogMonthly,
  FEATURE_CODE.adFree,
];

/** 혜택 한 줄 문구. 코드마다 어미가 달라 서버 name 을 그대로 쓸 수 없다. */
const benefitTitle = (feature: PlanFeatureDto): string => {
  if (feature.code === FEATURE_CODE.photoStorage && feature.limitValue != null) {
    return `${formatBytes(feature.limitValue * 1024 ** 2)} 대용량 업그레이드`;
  }
  if (feature.code === FEATURE_CODE.aiBlogMonthly && feature.limitValue != null) {
    return `AI 블로그 ${feature.limitValue}회 자동 생성`;
  }
  return feature.textValue ?? feature.name;
};

function BenefitRow({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <img src={icon} alt="" className="h-6 w-6 shrink-0" />
      <p className="min-w-0 flex-1 text-[17px] font-medium text-[#111]">{title}</p>
      <img src={checkIcon} alt="포함됨" className="h-6 w-6 shrink-0" />
    </div>
  );
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  /**
   * 이 화면의 진실은 `GET /subscriptions/me` 하나다.
   * `GET /users/me` 의 `currentPlan` 도 플랜 코드를 주지만 결제일·자동갱신·구독 id 가
   * 없어서 결제 정보와 취소 버튼을 못 그린다. 두 소스를 섞으면 서로 어긋난 값이
   * 한 화면에 뜨므로 여기서는 구독 응답만 쓴다.
   */
  const { data: subscription, isPending, isError, refetch } = useMySubscription();
  /*
   * 혜택 문구는 이 응답이 유일한 출처다. 실패를 시안 값으로 덮으면 실제와 다른
   * 용량·횟수를 보여주게 되므로, 상태를 받아 화면에서 갈라 그린다.
   */
  const {
    data: plans,
    isPending: isPlansPending,
    refetch: refetchPlans,
  } = useSubscriptionPlans();
  // 카드 표시는 구독과 별개 소스(GET /billing-keys)라 함께 조회한다.
  const { data: billingKeys } = useBillingKeys();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  /**
   * 플랜을 모르는 동안은 무료로 가정한다. 유료 화면을 먼저 그리면 구독 취소
   * 버튼이 잠깐 떴다 사라지는데, 그쪽이 더 나쁜 오해를 만든다.
   */
  const currentPlan = subscription?.plan.code ?? "FREE";
  const isFree = isFreePlan(currentPlan);
  /**
   * 해지해도 status 는 ACTIVE 로 남고 autoRenew 만 꺼진다 — '해지됨'은 이걸로 판별한다.
   *
   * ⚠️ `autoRenew` 만 보면 안 된다. 구독한 적 없는 무료 사용자에게도 서버가
   * `{ subscriptionId: null, status: 'FREE', autoRenew: false, expiresAt: null }`
   * 를 주기 때문에, 그들도 '해지됨'으로 잡혀 만료일 자리에 **1970년 1월 1일**이
   * 떴다(`new Date(null)` = Unix epoch).
   *
   * `subscriptionId` 가 있어야 실제로 구독했던 것이다.
   */
  const isCanceled = Boolean(
    subscription?.subscriptionId != null && !subscription.autoRenew,
  );

  /*
    사용량은 서버에 합계 API 가 없어 프론트가 나무별 사진 크기를 더해 낸다.
    비싼 계산이라 캐시를 무기한 들고, 사진이 늘거나 줄 때만 다시 센다
    (`useStorageUsage` 주석 참고). 못 구했으면 지어내지 않고 `-` 로 둔다.
  */
  const { data: storageUsed } = useStorageUsage();

  const currentPlanDto = plans?.find((plan) => plan.code === currentPlan);
  const storageMb = currentPlanDto
    ? findFeature(currentPlanDto, FEATURE_CODE.photoStorage)?.limitValue
    : null;
  // 서버 용량이 오면 그걸 쓰고, 아직이면 lib/plan.ts 의 시안 값으로 버틴다.
  const storageLimit =
    storageMb != null ? storageMb * 1024 ** 2 : getStorageLimitBytes(currentPlan);
  const planName = currentPlanDto
    ? planSummary(currentPlanDto).shortName
    : getShortPlanName(currentPlan);
  const cycleUnit = subscription?.plan.billingCycle === "YEARLY" ? "년" : "월";

  /**
   * 무료 사용자에겐 최상위 플랜의 혜택을 보여준다 — 이 자리는 업그레이드 유인이다.
   * 구독 중이면 본인이 실제로 받는 혜택을 보여준다(플러스인데 20GB 라고 쓰면 거짓말).
   * plans 는 가격 오름차순이라 마지막이 최상위다.
   */
  const showcasePlan = isFree ? plans?.[plans.length - 1] : currentPlanDto;
  const benefits = showcasePlan
    ? BENEFIT_ORDER.map((code) => findFeature(showcasePlan, code))
        .filter((feature): feature is PlanFeatureDto => Boolean(feature?.isEnabled))
        .map((feature) => ({
          icon: BENEFIT_ICON[feature.code],
          title: benefitTitle(feature),
        }))
    : [];

  const activeCard =
    billingKeys?.find((key) => key.status === "ACTIVE") ?? billingKeys?.[0];

  const nextBillingLabel = !subscription
    ? "-"
    : isCanceled
      ? "자동갱신 해지됨"
      : (formatKoreanDate(subscription.nextBillingAt) ?? "-");

  const handleCancel = () => {
    if (!subscription) return;
    cancelMutation.mutate(subscription.subscriptionId, {
      onSuccess: () => {
        setIsCancelOpen(false);
        // 만료일을 모르면 날짜를 지어내지 않고 문장만 바꾼다(1970년이 뜨던 자리).
        const until = formatKoreanDate(subscription.expiresAt);
        showToast(
          until
            ? `구독을 취소했어요. ${until}까지 그대로 이용할 수 있어요.`
            : "구독을 취소했어요. 남은 기간 동안은 그대로 이용할 수 있어요.",
          "info",
        );
      },
      onError: () => {
        setIsCancelOpen(false);
        showToast("구독 취소에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
      },
    });
  };

  const handleResume = () => {
    if (!subscription) return;
    resumeMutation.mutate(subscription.subscriptionId, {
      onSuccess: () => showToast("자동갱신을 다시 켰어요.", "success"),
      onError: () =>
        showToast("자동갱신 재개에 실패했어요. 잠시 후 다시 시도해 주세요.", "error"),
    });
  };

  return (
    <div className="relative flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="px-5 pt-4">
        <NavBar onBack={() => window.history.back()} title="구독 관리" />
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
        {/*
          조회에 실패하면 아래 화면이 "무료 플랜" 으로 그려진다. 유료 사용자에게
          장애 중 무료로 보이는 건 오해를 부르므로 사유를 먼저 알린다.
        */}
        {isError && (
          <div className="rounded-xl border-2 border-[#FF8A8A] bg-white px-5 py-4 text-center">
            <p className="text-[14px] text-[#FF5858]">
              구독 정보를 불러오지 못했어요. 아래는 실제 플랜과 다를 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#89986D] px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {isPending ? (
          // 플랜 배지 자리를 잡아 둬 레이아웃이 튀지 않게 한다
          <div className="mx-auto h-7 w-32 animate-pulse rounded bg-[#EAE6D2]" />
        ) : (
          <PlanBadge
            planName={planName}
            summary={
              subscription && !isFree
                ? [
                    {
                      label: "결제금액",
                      value: `${subscription.plan.price.toLocaleString("ko-KR")}원 / ${cycleUnit}`,
                    },
                    { label: "사진 용량", value: formatBytes(storageLimit) },
                  ]
                : undefined
            }
            note={
              !subscription
                ? null
                : isCanceled
                  ? // 만료일이 없으면 날짜를 빼고 상태만 알린다(1970년이 뜨던 자리).
                    [formatKoreanDate(subscription.expiresAt), "만료 · 자동갱신 꺼짐"]
                      .filter(Boolean)
                      .join(" ")
                  : formatKoreanDate(subscription.nextBillingAt)
                    ? `다음 결제: ${formatKoreanDate(subscription.nextBillingAt)}`
                    : null
            }
          />
        )}

        <StorageCard usedBytes={storageUsed ?? null} totalBytes={storageLimit} />

        {/*
          혜택 문구는 서버 요금제가 유일한 출처다. 못 받았으면 사유를 알리고
          다시 시도를 준다 — 시안 값으로 채우면 실제와 다른 용량·횟수를
          보여주게 되고, 사용자는 그게 틀렸다는 걸 알 방법이 없다.
        */}
        <section className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-1">
          {isPlansPending ? (
            <p className="py-6 text-center text-[14px] text-[#60655C]">
              요금제를 불러오는 중...
            </p>
          ) : benefits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[14px] text-[#FF5858]">요금제를 불러오지 못했어요.</p>
              <button
                type="button"
                onClick={() => refetchPlans()}
                className="mt-2 rounded-xl bg-[#89986D] px-4 py-1.5 text-[13px] font-medium text-white"
              >
                다시 시도
              </button>
            </div>
          ) : (
            benefits.map((benefit) => <BenefitRow key={benefit.title} {...benefit} />)
          )}
        </section>

        {!subscription || isFree ? (
          <button
            type="button"
            onClick={() => navigate(ROUTES.premium)}
            className="h-12 rounded-xl bg-[#DCEBC0] text-[17px] font-medium text-[#2C3930]"
          >
            프리미엄으로 업그레이드
          </button>
        ) : (
          <>
            <section>
              <div className="mb-2 flex items-end justify-between pl-1">
                <h2 className="text-[15px] font-medium text-[#9CAB84]">결제 정보</h2>
                <p className="text-[13px] text-[#2C3930]">
                  다음 결제일 : {nextBillingLabel}
                </p>
              </div>
              <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src={cardIcon} alt="" className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="text-[17px] font-medium text-[#111]">신용카드</p>
                    <p className="text-[13px] font-medium text-[#90908F]">
                      {activeCard ? activeCard.cardNumberMasked : "등록된 카드 없음"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/*
              취소해도 만료일까지는 구독이 살아 있다. 버튼을 '구독 취소'로 그대로 두면
              이미 취소했는지 알 수 없어, 해지 상태에서는 재개로 바꾼다.
            */}
            {isCanceled ? (
              <button
                type="button"
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="h-12 rounded-xl bg-[#DCEBC0] text-[17px] font-medium text-[#2C3930] disabled:opacity-60"
              >
                {resumeMutation.isPending ? "처리 중..." : "자동갱신 다시 켜기"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="h-12 rounded-xl bg-[#FFD5D5] text-[17px] font-medium text-[#FF4B4B]"
              >
                구독 취소
              </button>
            )}
          </>
        )}
      </div>

      {isCancelOpen && (
        <CancelSubscriptionModal
          onKeep={() => setIsCancelOpen(false)}
          onCancel={handleCancel}
          isPending={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
