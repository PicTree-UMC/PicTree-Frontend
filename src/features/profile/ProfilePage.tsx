import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { ROUTES } from "@/shared/constants/routes";
import { useSessionExpiredRedirect } from "@/features/auth/hooks/useSessionExpiredRedirect";
import { useMyProfile } from "./hooks/useMyProfile";
import { useNearbyAlertOpenListener } from "./hooks/useNearbyAlertOpenListener";
import { useNearbyAlertToggle } from "./hooks/useNearbyAlertToggle";
import { useMyPushSubscriptions } from "./hooks/usePushSubscription";
import { getPushUnavailableReason } from "./lib/webPush";
import { getPlanLabel } from "./lib/plan";
import { getApiErrorMessage, getProfileErrorKind } from "./lib/profileError";
import treeIcon from "./assets/icons/tree.svg";
import cardIcon from "./assets/icons/card.svg";
import statsIcon from "./assets/icons/stats.svg";
import starIcon from "./assets/icons/star.svg";
import logoutIcon from "./assets/icons/logout.svg";
import chevronIcon from "./assets/icons/chevron.svg";
import { useWithdraw } from "./hooks/useWithdraw";
import { WithdrawModal } from "./components/WithdrawModal";


interface MenuRowProps {
  icon: string; 
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

function MenuRow({ icon, title, subtitle, onClick }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      {icon && <img src={icon} alt="" className="h-6 w-6 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        {subtitle && (
          <p className="text-xs font-medium text-[#90908F]">{subtitle}</p>
        )}
      </div>
      {/* 오른쪽 화살표 (화살표_왼쪽.svg 는 오른쪽을 향하므로 회전 없이 사용) */}
      <img src={chevronIcon} alt="" className="h-[20px] w-[23px] flex-shrink-0" />
    </button>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { mutate: requestLogout, isPending: isLoggingOut } = useLogout();
  /**
   * `isLoading` 대신 `isPending` 을 쓴다. react-query v5 의 `isLoading` 은
   * `isPending && isFetching` 이라, 토큰이 없어 쿼리가 꺼진 동안 false 가 된다.
   * 그러면 데이터가 없는 채로 성공 분기가 그려져 닉네임·플랜이 빈 칸으로 남는다.
   */
  const { data: profile, isPending, isError, error, refetch } = useMyProfile();

  const { mutate: toggleAlarm, isPending: isUpdating } = useNearbyAlertToggle();
  const { isEnabled: hasPushSubscription } = useMyPushSubscriptions();

  // 푸시를 눌러 돌아온 경우 확인 처리를 건다.
  useNearbyAlertOpenListener();

  const errorKind = isError ? getProfileErrorKind(error) : null;

  // 401 은 화면에서 처리할 수 없다 — 토큰을 비우고 로그인 화면으로 보낸다.
  useSessionExpiredRedirect(errorKind === 'session-expired');

  /**
   * 프로필 이미지 로드 실패 여부.
   * URL 이 내려와도 실제로 못 불러오는 경우(만료된 CDN 링크 등)가 있어,
   * 이때 깨진 이미지 아이콘 대신 기본 나무 아이콘으로 떨어뜨린다.
   */
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);

  /**
   * 근처 나무 알림이 실제로 켜져 있는가.
   *
   * **두 조건이 모두 맞아야 켜진 것이다** — 서버 `check` 가 둘 다 볼 때만
   * 알림을 쏘기 때문이다.
   * 1. `notification` 플래그 (사용자의 의사)
   * 2. 활성 푸시 구독 (실제로 보낼 통로)
   *
   * 플래그만 켜진 상태를 "켜짐" 으로 보여 주면, 알림이 안 오는데 화면은
   * 켜졌다고 말하는 꼴이 된다. 다른 기기에서 껐거나 브라우저 알림 권한이
   * 취소되면 실제로 이 상태가 된다.
   */
  const alarmOn = (profile?.notification ?? false) && hasPushSubscription;

  /** 이 브라우저에서 아예 푸시를 못 쓰는 경우(예: iOS 를 홈 화면에 추가 안 함). */
  const pushUnavailable = getPushUnavailableReason();

  const planLabel = profile ? getPlanLabel(profile.currentPlan) : null;

  const { mutate: requestWithdraw, isPending: isWithdrawing } = useWithdraw();
  // 되돌릴 수 없는 동작이라 한 번 더 확인받는다
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      {/* 헤더 밴드 — 눌러서 내 정보 화면으로 */}
      <header className="bg-[#C5D89D] px-[31px] pb-8 pt-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.profileEdit)}
          aria-label="내 정보 보기"
          className="flex w-full items-center gap-5 text-left"
        >
          {/* 아바타 — 프로필 이미지가 없으면 기본 나무 아이콘 */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F6F0D7]">
            {profile?.profileImageUrl && !isAvatarBroken ? (
              <img
                src={profile.profileImageUrl}
                alt=""
                onError={() => setIsAvatarBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={treeIcon} alt="" className="h-9 w-9" />
            )}
          </div>

          {isPending ? (
            // 스켈레톤 — 닉네임·이메일·플랜 배지 자리를 그대로 잡아 레이아웃이 튀지 않게 한다
            <div className="flex flex-col gap-2">
              <div className="h-6 w-28 animate-pulse rounded bg-[#B4C98A]" />
              <div className="h-5 w-40 animate-pulse rounded bg-[#B4C98A]" />
              <div className="h-4 w-20 animate-pulse rounded-xl bg-[#B4C98A]" />
            </div>
          ) : errorKind === 'session-expired' ? (
            // useSessionExpiredRedirect 가 곧 로그인 화면으로 보낸다
            <p className="text-base font-semibold text-[#2C3930]">
              로그인 화면으로 이동합니다
            </p>
          ) : errorKind === 'account-unavailable' ? (
            // 정지·삭제된 계정. 재시도해도 결과가 바뀌지 않으니 사유만 알린다.
            <div>
              <p className="text-base font-semibold text-[#2C3930]">
                {getApiErrorMessage(error, '계정 정보를 확인할 수 없어요')}
              </p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.auth, { replace: true })}
                className="mt-1.5 rounded-xl bg-[#89986D] px-3 py-1 text-xs font-bold text-white"
              >
                로그인 화면으로
              </button>
            </div>
          ) : isError ? (
            // 500·네트워크 오류 — 여기서만 재시도가 의미 있다
            <div>
              <p className="text-base font-semibold text-[#2C3930]">
                {getApiErrorMessage(error, '정보를 불러오지 못했어요')}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-1.5 rounded-xl bg-[#89986D] px-3 py-1 text-xs font-bold text-white"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-black">{profile?.nickname}</p>
              {/* 이메일은 소셜 계정에 따라 없을 수 있어 있을 때만 그린다 */}
              {profile?.email && (
                <p className="mt-0.5 text-base font-medium text-black">
                  {profile.email}
                </p>
              )}
              <span className="mt-1.5 inline-block rounded-xl bg-[#DDBF68] px-3 py-0.5 text-[10px] font-medium text-[#2C3930]">
                {planLabel}
              </span>
            </div>
          )}
        </button>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
        {/* 근처 나무 알림 카드 */}
        <div className="flex items-center justify-between rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-[#111]">근처 나무 알림</p>
            {/*
              아이폰은 홈 화면에 추가해야만 푸시를 받을 수 있다(웹 표준 제약).
              그냥 "꺼짐" 이라고만 하면 켜지지 않는 이유를 알 수 없어 따로 안내한다.
            */}
            <p className="mt-0.5 text-xs font-medium text-[#90908F]">
              {pushUnavailable === "ios-needs-install"
                ? "홈 화면에 추가하면 알림을 받을 수 있어요"
                : `${alarmOn ? "켜짐" : "꺼짐"} · 50m 안에 내 나무가 있으면 알려드려요`}
            </p>
          </div>
          {/* 토글 */}
          <button
            type="button"
            role="switch"
            aria-checked={alarmOn}
            aria-label="근처 나무 알림"
            // 프로필을 못 불러왔으면 무엇을 바꿀지 알 수 없어 막는다
            disabled={!profile || isUpdating}
            onClick={() => toggleAlarm(!alarmOn)}
            className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              alarmOn ? "bg-[#9CAB84]" : "bg-[#CCC]"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${
                alarmOn ? "left-[19px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {/* 알림 기록 — 알림 카드 바로 아래에 둔다. 같은 주제라 붙여 읽힌다. */}
        <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
          <MenuRow
            icon=""
            title="알림 기록"
            subtitle="받은 알림을 다시 확인해요"
            onClick={() => navigate(ROUTES.alertLogs)}
          />
        </div>

        {/* 계정 섹션 */}
        <section>
          <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
            계정
          </h2>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
            <MenuRow
              icon={cardIcon}
              title="구독 및 결제"
              subtitle={planLabel ? `${planLabel} · 이용중` : undefined}
              onClick={() => navigate(ROUTES.subscription)}
            />
            <MenuRow
              icon={statsIcon}
              title="여행 캘린더"
              subtitle="잔디로 보는 나의 여행기록"
              onClick={() => navigate(ROUTES.calendar)}
            />
            <MenuRow
              icon={starIcon}
              title="즐겨찾기 장소"
              subtitle="다시 방문하고 싶은 장소 관리"
              onClick={() => navigate(ROUTES.favorites)}
            />
          </div>
        </section>

        {/* 정보 섹션 */}
        <section>
          <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
            정보
          </h2>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
            <MenuRow
              icon=""
              title="개인정보 처리방침"
              onClick={() => navigate(ROUTES.privacy)}
            />
            <MenuRow icon="" title="도움말 / FAQ" />
          </div>
        </section>

        {/* 로그아웃 — 요청 중에는 중복 클릭 방지 */}
        <button
          type="button"
          onClick={() => requestLogout()}
          disabled={isLoggingOut}
          className="mt-1 flex items-center justify-center gap-2 py-2 disabled:opacity-50"
        >
          <img src={logoutIcon} alt="" className="h-6 w-6" />
          <span className="text-base text-[#FF4B4B]">
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </span>
        </button>

        {/*
          회원 탈퇴 — 로그아웃 아래에 한 칸 띄워 조용히 둔다.
          로그아웃은 되돌릴 수 있고 탈퇴는 못 되돌리므로, 나란히 같은 빨강으로
          두면 동급으로 읽히고 오탭 위험도 생긴다. 찾는 사람은 찾되 눈에 먼저
          걸리지는 않도록 회색·작은 글씨로 낮춘다.
        */}
        <button
          type="button"
          onClick={() => setIsWithdrawModalOpen(true)}
          className="mx-auto -mt-1 py-2 text-[13px] text-[#90908F] underline underline-offset-2"
        >
          회원탈퇴
        </button>
      </div>

      {isWithdrawModalOpen && (
        <WithdrawModal
          isWithdrawing={isWithdrawing}
          onCancel={() => setIsWithdrawModalOpen(false)}
          onConfirm={() => requestWithdraw()}
        />
      )}
    </div>
  );
}
