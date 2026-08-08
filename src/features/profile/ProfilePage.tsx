import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useSessionExpiredRedirect } from "@/features/auth/hooks/useSessionExpiredRedirect";
import { SettingsFooter, SettingsList, SettingsRow } from "@/shared/components";
import { useMyProfile } from "./hooks/useMyProfile";
import { useNearbyAlertOpenListener } from "./hooks/useNearbyAlertOpenListener";
import { useNearbyAlertToggle } from "./hooks/useNearbyAlertToggle";
import { useMyPushSubscriptions } from "./hooks/usePushSubscription";
import { getPushUnavailableReason } from "./lib/webPush";
import { getApiErrorMessage, getProfileErrorKind } from "./lib/profileError";
import { ProfileSummary } from "./components/ProfileSummary";
import treeIcon from "./assets/icons/tree.svg";
import accountImage from "./assets/icons/account3d.jpg";
import cardImage from "./assets/icons/card3d.jpg";
// 이 둘만 투명 PNG 다 — 다른 세트에서 왔고 흰 배경이 안 구워져 있다(§8).
import calendarImage from "./assets/icons/calendar3d.png";
import favoriteImage from "./assets/icons/favorite3d.png";
import alertImage from "./assets/icons/alert3d.jpg";
import alertLogImage from "./assets/icons/alertLog3d.jpg";

export function ProfilePage() {
  const navigate = useNavigate();
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

  return (
    /*
      `pb-nav` 가 여기 없다. 탭바를 피하는 그 여백은 맨 아래 `ProfileSummary` 가 자기
      패딩으로 갖는다 — 루트에 두면 그 자리가 페이지 배경(크림)으로 남아, 배경이 다른
      요약 띠가 탭바 위에서 끊기고 그 아래로 크림 띠가 한 줄 되살아난다.

      ⚠️ 그래서 이 페이지의 마지막 자식은 **항상 `ProfileSummary` 여야 한다.** 뒤에 무언가
      더 붙이면 그것이 탭바에 가린다.
    */
    <div className="flex min-h-full flex-col bg-[#FFFCEF]">
      {/*
        머리글 — 아바타·이름·이메일을 가운데 모은다.
        종전엔 초록 밴드 전체가 '내 정보' 로 가는 버튼이었는데, 누를 수 있다는 신호가
        밴드 어디에도 없어서 사실상 숨은 진입점이었다. 지금은 머리글을 읽는 자리로 두고
        아래 `개인정보` 줄이 그 일을 맡는다.
      */}
      <header className="flex flex-col items-center px-5 pt-header">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[#F6F0D7]">
          {profile?.profileImageUrl && !isAvatarBroken ? (
            <img
              src={profile.profileImageUrl}
              alt=""
              onError={() => setIsAvatarBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={treeIcon} alt="" className="size-11" />
          )}
        </div>

        {isPending ? (
          // 스켈레톤 — 이름·이메일 자리를 그대로 잡아 레이아웃이 튀지 않게 한다
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="h-6 w-28 animate-pulse rounded bg-[#F6F0D7]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[#F6F0D7]" />
          </div>
        ) : errorKind === 'session-expired' ? (
          // useSessionExpiredRedirect 가 곧 로그인 화면으로 보낸다
          <p className="mt-3 text-[15px] font-medium text-[#2C3930]">
            로그인 화면으로 이동합니다
          </p>
        ) : errorKind === 'account-unavailable' ? (
          // 정지·삭제된 계정. 재시도해도 결과가 바뀌지 않으니 사유만 알린다.
          <div className="mt-3 flex flex-col items-center">
            <p className="text-[15px] font-medium text-[#2C3930]">
              {getApiErrorMessage(error, '계정 정보를 확인할 수 없어요')}
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.auth, { replace: true })}
              className="mt-2 rounded-xl bg-[#5B6B38] px-3 py-1 text-[13px] font-medium text-white"
            >
              로그인 화면으로
            </button>
          </div>
        ) : isError ? (
          // 500·네트워크 오류 — 여기서만 재시도가 의미 있다
          <div className="mt-3 flex flex-col items-center">
            <p className="text-[15px] font-medium text-[#2C3930]">
              {getApiErrorMessage(error, '정보를 불러오지 못했어요')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#5B6B38] px-3 py-1 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <p className="mt-3 text-[20px] font-medium text-[#2C3930]">{profile?.nickname}</p>
            {/* 이메일은 소셜 계정에 따라 없을 수 있어 있을 때만 그린다 */}
            {profile?.email && (
              <p className="mt-0.5 text-[15px] text-[#60655C]">{profile.email}</p>
            )}
          </>
        )}
      </header>

      <div className="flex flex-col gap-6 px-5 pt-7">
        {/*
          계정 — 종전의 '계정' 묶음에 `개인정보`(옛 헤더 밴드의 진입점)를 앞에 붙였다.
          섹션 제목은 두지 않는다. 카드 사이 간격만으로 묶음이 읽히고, 제목까지 있으면
          네 글자짜리 초록 라벨이 정작 줄 내용보다 눈에 먼저 들어온다.
        */}
        <SettingsList>
          <SettingsRow
            image={accountImage}
            title="개인정보"
            onClick={() => navigate(ROUTES.profileEdit)}
          />
          {/*
            '결제 수단' 은 이 목록이 아니라 '개인정보'(내 정보) 안에 있다. 카드는 구독보다
            오래 살고(해지해도 남는다) 만료·교체가 구독과 무관해서 '구독' 줄에 묶을 수
            없는데, 그렇다고 최상위 줄로 세우기엔 평생 한두 번 여는 화면이다.
          */}
          <SettingsRow
            image={cardImage}
            title="구독"
            /*
              오른쪽에 플랜 이름을 달지 않는다. 한때 달았는데(`iCloud 50GB` 꼴), 페이지
              맨 아래 요약이 같은 이름을 가격까지 붙여 다시 말하게 되면서 한 화면에서
              같은 값을 두 번 읽히는 자리가 됐다. 상태는 아래 요약이 맡고 이 줄은 문만
              연다 (프리미엄 페이지가 PlanIntroCard 를 지운 것과 같은 이유).
            */
            /*
              플랜과 무관하게 /premium 으로 보낸다. 한때 구독자만 구 관리 화면
              (/profile/subscription)으로 갈랐는데, /premium 이 요금제·비교표·해지·
              현재 플랜 표시를 모두 갖게 되면서 갈라 보낼 이유가 없어졌다. 그 화면은
              길이 끊긴 채 남아 있다가 용량 카드를 이 페이지로 옮기면서 지웠다.
            */
            onClick={() => navigate(ROUTES.premium)}
          />
          <SettingsRow
            image={calendarImage}
            title="여행 캘린더"
            onClick={() => navigate(ROUTES.calendar)}
          />
          <SettingsRow
            image={favoriteImage}
            title="즐겨찾기 장소"
            onClick={() => navigate(ROUTES.favorites)}
          />
        </SettingsList>

        {/* 알림 */}
        <div>
          <SettingsList>
            <SettingsRow
              image={alertImage}
              title="근처 나무 알림"
              trailing={
                <button
                  type="button"
                  role="switch"
                  aria-checked={alarmOn}
                  aria-label="근처 나무 알림"
                  // 프로필을 못 불러왔으면 무엇을 바꿀지 알 수 없어 막는다
                  disabled={!profile || isUpdating}
                  onClick={() => toggleAlarm(!alarmOn)}
                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    alarmOn ? "bg-[#5B6B38]" : "bg-[#D9D9D9]"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] size-[18px] rounded-full bg-white transition-all ${
                      alarmOn ? "left-[19px]" : "left-[3px]"
                    }`}
                  />
                </button>
              }
            />
            {/*
              같은 카드의 위 줄(나무+종)과 종 모양을 공유한다 — 알림을 받는 설정과 받은
              알림을 보는 곳이라 한 가족으로 읽히는 게 맞다.
            */}
            <SettingsRow
              image={alertLogImage}
              title="알림 기록"
              onClick={() => navigate(ROUTES.alertLogs)}
            />
          </SettingsList>

          {/*
            아이폰은 홈 화면에 추가해야만 푸시를 받을 수 있다(웹 표준 제약).
            그냥 토글이 꺼져 있기만 하면 켜지지 않는 이유를 알 수 없어 따로 안내한다.
          */}
          <SettingsFooter>
            {pushUnavailable === "ios-needs-install"
              ? "홈 화면에 추가하면 알림을 받을 수 있어요."
              : "50m 안에 내 나무가 있으면 알려드려요."}
          </SettingsFooter>
        </div>

        {/*
          정보 — 아이콘을 달지 않는다. 앞의 두 카드가 '내 계정에서 하는 일' 이라면 이쪽은
          읽기만 하는 문서라, 타일까지 붙이면 같은 무게로 읽힌다. 구분선 들여쓰기는
          `SettingsList` 가 아이콘 유무를 보고 알아서 맞춘다.
        */}
        <SettingsList>
          <SettingsRow title="개인정보 처리방침" onClick={() => navigate(ROUTES.privacy)} />
          <SettingsRow title="도움말 / FAQ" onClick={() => navigate(ROUTES.helpFaq)} />
        </SettingsList>
      </div>

      {/*
        맨 아래 요약 — 내 계정이 지금 어떤 상태인가(요금제·쓴 용량·남은 토큰).

        **목록 위가 아니라 아래인 이유**: 이 페이지에 온 사람은 대개 무언가를 하러 온다
        (설정을 바꾸거나 다른 화면으로 간다). 요약을 맨 위에 얹으면 그 목록이 한 화면
        아래로 밀린다. 값은 확인하러 오는 것이지 찾아오는 게 아니라서, 스크롤 끝에서
        만나는 편이 맞다 — 참고한 iCloud 도 같은 자리에 둔다.

        **본문 컨테이너 밖이다.** 배경이 다른 띠라 화면 폭을 다 써야 한다 — 위 카드들과
        같은 `px-5` 안에 두면 좌우가 잘려 넓은 카드 하나로 보인다. 가로 여백은 그쪽에서
        따로 준다.

        로그아웃·회원탈퇴가 있던 자리다. 둘은 '내 정보'(/profile/edit) 로 옮겼다 —
        계정 자체를 끝내는 동작이라 계정을 여는 화면에 있는 게 맞고, 여기 두면 값을
        보러 스크롤을 내린 손 끝에 탈퇴 버튼이 놓인다.
      */}
      <ProfileSummary />
    </div>
  );
}
