import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useSessionExpiredRedirect } from "@/features/auth/hooks/useSessionExpiredRedirect";
import { SettingsList, SettingsRow, Skeleton } from "@/shared/components";
import { useMyProfile } from "./hooks/useMyProfile";
import { getApiErrorMessage } from "@/shared/lib/apiError";
import { getProfileErrorKind } from "./lib/profileError";
import { ProfileSummary } from "./components/ProfileSummary";
import treeIcon from "./assets/icons/tree.svg";
import accountImage from "./assets/icons/account3d.jpg";
import cardImage from "./assets/icons/card3d.jpg";
// 이 둘만 투명 PNG 다 — 다른 세트에서 왔고 흰 배경이 안 구워져 있다(§8).
import calendarImage from "./assets/icons/calendar3d.png";
import favoriteImage from "./assets/icons/favorite3d.png";

export function ProfilePage() {
  const navigate = useNavigate();
  /**
   * `isLoading` 대신 `isPending` 을 쓴다. react-query v5 의 `isLoading` 은
   * `isPending && isFetching` 이라, 토큰이 없어 쿼리가 꺼진 동안 false 가 된다.
   * 그러면 데이터가 없는 채로 성공 분기가 그려져 닉네임·플랜이 빈 칸으로 남는다.
   */
  const { data: profile, isPending, isError, error, refetch } = useMyProfile();

  const errorKind = isError ? getProfileErrorKind(error) : null;

  // 401 은 화면에서 처리할 수 없다 — 토큰을 비우고 로그인 화면으로 보낸다.
  useSessionExpiredRedirect(errorKind === 'session-expired');

  /**
   * 프로필 이미지 로드 실패 여부.
   * URL 이 내려와도 실제로 못 불러오는 경우(만료된 CDN 링크 등)가 있어,
   * 이때 깨진 이미지 아이콘 대신 기본 나무 아이콘으로 떨어뜨린다.
   */
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);

  return (
    /*
      `pb-nav` 가 루트에 있다. 한때는 맨 아래 `ProfileSummary` 가 자기 패딩으로 가졌는데,
      그건 그 띠가 마지막 자식이라 배경이 탭바까지 이어져야 했기 때문이다. 요약이 위로
      올라가면서 마지막 자식이 다시 크림 바닥의 목록이 됐고, 그래서 루트가 맡는 게 맞다.
    */
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      {/*
        머리글 — 아바타와 닉네임을 가운데 모은다.
        종전엔 초록 밴드 전체가 '내 정보' 로 가는 버튼이었는데, 누를 수 있다는 신호가
        밴드 어디에도 없어서 사실상 숨은 진입점이었다. 지금은 머리글을 읽는 자리로 두고
        아래 `개인정보` 줄이 그 일을 맡는다.
      */}
      <header className="flex flex-col items-center px-5 pt-header">
        {/*
          ⚠️ **96px 에서 64px 로 줄였다.** 이 머리글은 읽는 자리일 뿐인데 아바타가 그중
          제일 큰 덩어리라, 줄인 만큼 아래 요약·목록이 첫 화면에 더 들어온다.
          기본 나무 글리프는 지름 대비 비율(약 46%)을 지켜 44px → 28px 로 같이 줄인다.
        */}
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-cream-sub">
          {profile?.profileImageUrl && !isAvatarBroken ? (
            <img
              src={profile.profileImageUrl}
              alt=""
              onError={() => setIsAvatarBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={treeIcon} alt="" className="size-7" />
          )}
        </div>

        {isPending ? (
          // 스켈레톤 — 닉네임 한 줄 자리를 그대로 잡아 레이아웃이 튀지 않게 한다
          <Skeleton className="mt-3 h-6 w-28 rounded" />
        ) : errorKind === 'session-expired' ? (
          // useSessionExpiredRedirect 가 곧 로그인 화면으로 보낸다
          <p className="mt-3 text-[15px] font-medium text-ink">
            로그인 화면으로 이동합니다
          </p>
        ) : errorKind === 'account-unavailable' ? (
          // 정지·삭제된 계정. 재시도해도 결과가 바뀌지 않으니 사유만 알린다.
          <div className="mt-3 flex flex-col items-center">
            <p className="text-[15px] font-medium text-ink">
              {getApiErrorMessage(error, '계정 정보를 확인할 수 없어요')}
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.auth, { replace: true })}
              className="mt-2 rounded-xl bg-pictree-700 px-3 py-1 text-[13px] font-medium text-white"
            >
              로그인 화면으로
            </button>
          </div>
        ) : isError ? (
          // 500·네트워크 오류 — 여기서만 재시도가 의미 있다
          <div className="mt-3 flex flex-col items-center">
            <p className="text-[15px] font-medium text-ink">
              {getApiErrorMessage(error, '정보를 불러오지 못했어요')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-3 py-1 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : (
          /*
            ⚠️ **이메일 줄을 뺐다.** 소셜 계정에 따라 있을 때만 그리던 값이라 계정마다
            머리글 높이가 달랐고, 여기서 할 수 있는 일이 없는 읽기 전용 값이다.
            바꾸거나 확인하려면 아래 `개인정보` 줄로 들어가면 된다 — 거기 있다.
          */
          <p className="mt-3 text-[20px] font-medium text-ink">{profile?.nickname}</p>
        )}
      </header>

      <div className="flex flex-col gap-6 px-5 pt-7">
        {/*
          요약 — 내 계정이 지금 어떤 상태인가(심은 나무·사진·요금제·토큰 + 쓴 용량).

          **머리글 바로 아래다.** 한때 페이지 맨 끝에 뒀는데(iCloud 가 그렇다), 그건 값이
          글 세 줄이라 훑고 지나가는 자리였을 때의 배치다. 값이 칸으로 서면서 이 화면에서
          제일 먼저 눈에 들어와야 하는 것이 됐다 — 이름 아래에서 "내가 여기 얼마나 쌓았나"
          를 먼저 보여주고, 할 일 목록은 그 다음이다.

          **이제 본문 컨테이너 안이다.** 배경이 크림으로 통일되면서 화면 폭을 다 쓸 이유가
          없어졌다 — 아래 목록과 같은 `px-5` 를 공유하고 간격도 `gap-6` 하나로 맞는다.
        */}
        <ProfileSummary />
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

        {/*
          알림 묶음(`근처 나무 알림` 토글 · `알림 기록`)이 있던 자리다. 웹 푸시를 통째로
          걷어내면서 둘 다 없앴다 — 앱을 끄면 위치를 못 읽어(PWA 제약) 정작 기대하던
          "가까이 가면 알려준다" 가 성립하지 않았다. 지금은 지도를 보고 있는 동안
          홈 상단 배너가 그 일을 한다. 켜고 끌 것이 없어 설정 줄도 필요 없다.
        */}

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
        로그아웃·회원탈퇴가 있던 자리다. 둘은 '내 정보'(/profile/edit) 로 옮겼다 —
        계정 자체를 끝내는 동작이라 계정을 여는 화면에 있는 게 맞고, 여기 두면 값을
        보러 스크롤을 내린 손 끝에 탈퇴 버튼이 놓인다.
      */}
    </div>
  );
}
