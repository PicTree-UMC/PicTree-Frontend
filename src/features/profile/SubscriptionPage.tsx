import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useToast } from "@/shared/components";
import { useMyProfile } from "./hooks/useMyProfile";
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

/** 시안(WF-017)의 혜택 3줄. 무료·유료 모두 같은 목록을 보여준다. */
const BENEFITS = [
  { icon: gisRouteIcon, title: "20GB 대용량 업그레이드" },
  { icon: menuBookIcon, title: "AI 블로그 50회 자동 생성" },
  { icon: adsOffIcon, title: "광고 제거" },
];

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
  const { data: profile, isPending } = useMyProfile();
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  /**
   * 플랜을 모르는 동안은 무료로 가정한다. 유료 화면을 먼저 그리면 구독 취소
   * 버튼이 잠깐 떴다 사라지는데, 그쪽이 더 나쁜 오해를 만든다.
   */
  const currentPlan = profile?.currentPlan ?? "FREE";
  const isFree = isFreePlan(currentPlan);
  const storageLimit = getStorageLimitBytes(currentPlan);

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
            planName={getShortPlanName(currentPlan)}
            summary={
              isFree
                ? undefined
                : [
                    /**
                     * ⚠️ 결제금액은 `GET /subscriptions/me` 의 `plan.price`·
                     * `billingCycle` 로 채워야 한다. 아직 연동 전이라 시안 값이다.
                     */
                    { label: "결제금액", value: "39,900원 / 월" },
                    { label: "사진 용량", value: formatBytes(storageLimit) },
                  ]
            }
            note={isFree ? null : "다음 결제: 2026년 5월 29일"}
          />
        )}

        <StorageCard usedBytes={null} totalBytes={storageLimit} />

        <section className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-1">
          {BENEFITS.map((benefit) => (
            <BenefitRow key={benefit.title} {...benefit} />
          ))}
        </section>

        {isFree ? (
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
                  다음 결제일 : 2026년 4월 29일
                </p>
              </div>
              {/* ⚠️ 카드 정보를 주는 API 가 없다 — billing-keys 연동 전까지 시안 값이다 */}
              <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src={cardIcon} alt="" className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="text-lg font-semibold text-[#111]">신용카드</p>
                    <p className="text-xs font-medium text-[#90908F]">
                      **** **** **** 1234
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => setIsCancelOpen(true)}
              className="h-12 rounded-xl bg-[#FFD5D5] text-lg font-semibold text-[#FF4B4B]"
            >
              구독 취소
            </button>
          </>
        )}
      </div>

      {isCancelOpen && (
        <CancelSubscriptionModal
          onKeep={() => setIsCancelOpen(false)}
          onCancel={() => {
            /**
             * ⚠️ 아직 서버에 취소를 보내지 않는다. `POST /subscriptions/{id}/cancel`
             * 이 있지만 구독 id 를 알려면 `GET /subscriptions/me` 연동이 먼저다.
             */
            setIsCancelOpen(false);
            showToast("구독 취소는 준비 중이에요.", "info");
          }}
        />
      )}
    </div>
  );
}
