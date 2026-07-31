import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useToast } from "@/shared/components";
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
import { CancelSubscriptionModal } from "./components/CancelSubscriptionModal";
import cardIcon from "./assets/icons/card.svg";
import checkIcon from "./assets/icons/check.svg";
import gisRouteIcon from "./assets/icons/gisRoute.svg";
import menuBookIcon from "./assets/icons/menuBook.svg";
import adsOffIcon from "./assets/icons/adsoff.svg";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";

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

/** 요금제를 아직 못 받았을 때 자리를 지키는 시안 값. 받아오면 즉시 대체된다. */
const FALLBACK_BENEFITS = [
  { icon: gisRouteIcon, title: "20GB 대용량 업그레이드" },
  { icon: menuBookIcon, title: "AI 블로그 50회 자동 생성" },
  { icon: adsOffIcon, title: "광고 제거" },
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
      <p className="min-w-0 flex-1 text-lg font-semibold text-[#111]">{title}</p>
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
  const { data: subscription, isPending } = useMySubscription();
  const { data: plans } = useSubscriptionPlans();
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
  // 해지해도 status 는 ACTIVE 로 남고 autoRenew 만 꺼진다 — '해지됨'은 이걸로 판별한다.
  const isCanceled = Boolean(subscription && !subscription.autoRenew);

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
    : FALLBACK_BENEFITS;

  const activeCard =
    billingKeys?.find((key) => key.status === "ACTIVE") ?? billingKeys?.[0];

  const nextBillingLabel = !subscription
    ? "-"
    : isCanceled
      ? "자동갱신 해지됨"
      : subscription.nextBillingAt
        ? formatKoreanDate(subscription.nextBillingAt)
        : "-";

  const handleCancel = () => {
    if (!subscription) return;
    cancelMutation.mutate(subscription.subscriptionId, {
      onSuccess: () => {
        setIsCancelOpen(false);
        showToast(
          `구독을 취소했어요. ${formatKoreanDate(subscription.expiresAt)}까지 그대로 이용할 수 있어요.`,
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
    <div className="relative flex min-h-full flex-col bg-[#FFFCEF] pb-28">
      <header className="flex items-center gap-3 px-5 pt-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="뒤로 가기"
          className="flex h-6 w-6 items-center justify-center"
        >
          <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
        </button>
        <h1 className="text-xl font-bold text-black">구독 관리</h1>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
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
                  ? `${formatKoreanDate(subscription.expiresAt)} 만료 · 자동갱신 꺼짐`
                  : subscription.nextBillingAt
                    ? `다음 결제: ${formatKoreanDate(subscription.nextBillingAt)}`
                    : null
            }
          />
        )}

        <StorageCard usedBytes={null} totalBytes={storageLimit} />

        <section className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-1">
          {benefits.map((benefit) => (
            <BenefitRow key={benefit.title} {...benefit} />
          ))}
        </section>

        {!subscription || isFree ? (
          <button
            type="button"
            onClick={() => navigate(ROUTES.premium)}
            className="h-12 rounded-xl bg-[#DCEBC0] text-lg font-semibold text-[#2C3930]"
          >
            프리미엄으로 업그레이드
          </button>
        ) : (
          <>
            <section>
              <div className="mb-2 flex items-end justify-between pl-1">
                <h2 className="text-[15px] font-semibold text-[#9CAB84]">결제 정보</h2>
                <p className="text-[10px] text-[#2C3930]">
                  다음 결제일 : {nextBillingLabel}
                </p>
              </div>
              <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src={cardIcon} alt="" className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="text-lg font-semibold text-[#111]">신용카드</p>
                    <p className="text-xs font-medium text-[#90908F]">
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
                className="h-12 rounded-xl bg-[#DCEBC0] text-lg font-semibold text-[#2C3930] disabled:opacity-60"
              >
                {resumeMutation.isPending ? "처리 중..." : "자동갱신 다시 켜기"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="h-12 rounded-xl bg-[#FFD5D5] text-lg font-semibold text-[#FF4B4B]"
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
