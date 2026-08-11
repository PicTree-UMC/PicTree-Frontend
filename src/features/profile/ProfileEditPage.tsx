import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NavBar,
  SettingsFooter,
  SettingsList,
  SettingsRow,
  Skeleton,
  useToast,
} from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMyProfile } from "./hooks/useMyProfile";
import { useUpdateMyProfile } from "./hooks/useUpdateMyProfile";
import { useWithdraw } from "./hooks/useWithdraw";
import { NicknameEditSheet } from "./components/NicknameEditSheet";
import { WithdrawModal } from "./components/WithdrawModal";
import treeIcon from "./assets/icons/tree.svg";
import cardImage from "./assets/icons/card3d.jpg";
import receiptImage from "./assets/icons/receipt3d.svg";

/**
 * 값 자리를 잡아 두는 막대. 줄 높이가 로딩 끝에 튀지 않게 한다.
 *
 * 공용 `Skeleton` 을 감싸 **높이(15px 줄에 맞춘 `h-4`)만 고정**한다 — 이 화면의 스켈레톤은
 * 전부 설정 줄의 값 자리라 폭만 다르다.
 */
function ValueSkeleton({ className }: { className: string }) {
  return <Skeleton className={`h-4 rounded ${className}`} />;
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: profile, isPending, isError, refetch } = useMyProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateMyProfile();
  const { mutate: requestLogout, isPending: isLoggingOut } = useLogout();
  const { mutate: requestWithdraw, isPending: isWithdrawing } = useWithdraw();

  const [isNicknameSheetOpen, setIsNicknameSheetOpen] = useState(false);
  // 되돌릴 수 없는 동작이라 한 번 더 확인받는다
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  /**
   * URL 이 내려와도 실제로 못 불러오는 경우(만료된 CDN 링크 등)가 있어,
   * 이때 깨진 이미지 아이콘 대신 기본 나무 아이콘으로 떨어뜨린다.
   */
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);

  const hasImage = Boolean(profile?.profileImageUrl) && !isAvatarBroken;

  const handleSaveNickname = (nickname: string) => {
    updateProfile(
      { nickname },
      {
        onSuccess: () => {
          setIsNicknameSheetOpen(false);
          showToast("닉네임을 바꿨어요.", "success");
        },
      },
    );
  };

  return (
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      {/* pt-header 는 safe-area 몫이다 — pt-4 로는 노치 기기에서 제목이 가린다. */}
      <header className="px-5 pb-2 pt-header">
        <NavBar onBack={() => navigate(-1)} title="내 정보" />
      </header>

      {/*
        아바타 — **마이페이지 머리글과 같은 64px.** 두 화면이 연달아 열리는데 여기만 96px 이라
        들어오는 순간 아바타가 한 번 커졌다가 나가면서 작아졌다.

        목록에 줄로 넣지 않고 머리글로 남긴 이유: 이 화면은 마이페이지 머리글의 편집판이라
        같은 자리에 같은 크기로 있는 편이 이어져 읽히고, 34px 짜리로 줄에 들어가면 '내 사진'
        이 아니라 설정 아이콘처럼 보인다.
      */}
      <div className="mt-2 flex flex-col items-center px-5">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-cream-sub">
          {hasImage && profile?.profileImageUrl ? (
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

      </div>

      <div className="flex flex-col gap-6 px-5 pt-6">
        {/*
          조회에 실패하면 값이 빈 줄만 남아 왜 비었는지 알 수 없다. 저장할 길은 어차피
          막혀 있지만(줄이 안 열린다) 사유와 재시도 수단은 있어야 한다.
        */}
        {isError && (
          <div className="rounded-xl border border-error bg-error-surface px-5 py-4 text-center">
            <p className="text-[15px] text-error">내 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {/*
          내 정보 — 종전엔 초록 라벨이 붙은 입력 카드 두 장이었다. 이 화면에서 실제로 고칠 수
          있는 값이 닉네임 하나뿐인데 그 하나 때문에 페이지 전체가 폼 언어를 쓰고 있었고,
          바로 아래 결제·계정 묶음은 그룹 리스트라 한 화면에 언어가 두 벌이었다.
          지금은 줄이 값을 보여주고, 고치는 일은 시트가 맡는다.
        */}
        <div>
          <SettingsList>
            <SettingsRow
              title="닉네임"
              value={
                isPending ? <ValueSkeleton className="w-20" /> : (profile?.nickname ?? "—")
              }
              // 값을 못 받은 상태에서 열면 시트가 빈 칸으로 뜨고, 저장하면 서버 값을
              // 모르는 채로 덮어쓴다. 프로필이 올 때까지 줄을 잠근다.
              onClick={() => setIsNicknameSheetOpen(true)}
              disabled={!profile}
            />
            <SettingsRow
              title="이메일"
              value={
                isPending ? (
                  <ValueSkeleton className="w-32" />
                ) : (
                  // 카카오는 이메일 동의를 안 하면 null 로 온다
                  (profile?.email ?? "등록된 이메일 없음")
                )
              }
              /*
                `onClick` 을 주지 않아 꺾쇠도 없다 — 열 데가 없다는 걸 줄 생김새가 말한다.
                종전의 회색 채움 카드가 하던 '못 고친다' 를 여기서는 꺾쇠의 부재가 한다.
              */
            />
          </SettingsList>
          <SettingsFooter>
            이메일은 소셜 계정에서 가져온 값이라 앱에서는 바꿀 수 없어요.
          </SettingsFooter>
        </div>

        {/*
          결제 수단은 값이 아니라 다른 화면으로 나가는 문이라 카드를 가른다.

          프로필 최상위 목록이 아니라 여기 있는 이유: 카드는 평생 한두 번 여는 화면이라
          최상위 줄을 하나 차지할 만큼 자주 쓰이지 않고, 내용상 '내 정보' 에 딸린 값이다.
        */}
        <SettingsList>
          <SettingsRow
            image={cardImage}
            title="결제 수단"
            onClick={() => navigate(ROUTES.paymentMethods)}
          />
          {/*
            결제 수단과 같은 카드에 둔다 — 둘 다 '돈' 이고, 카드를 가르면 내역이 어디에
            딸린 화면인지 흐려진다. 순서는 **수단이 먼저, 내역이 나중**이다: 수단은 고치는
            것이고 내역은 읽는 것이라, 하는 일이 앞에 온다(로그아웃·탈퇴 카드와 같은 결).
          */}
          <SettingsRow
            /*
              위 '결제 수단' 과 **같은 가족이되 같은 그림은 아니다** — 카드는 눕고 영수증은
              서며, 초록 배지가 체크(수단이 등록됐다)가 아니라 ₩(돈이 오갔다)다.
              두 줄에 같은 그림을 두면 복사한 것처럼 읽힌다(`receipt3d.svg` 주석).
            */
            image={receiptImage}
            title="결제 내역"
            onClick={() => navigate(ROUTES.paymentHistory)}
          />
        </SettingsList>

        {/*
          계정에서 빠져나가는 동작 둘. 프로필 최상위 목록 맨 아래에 있던 것을 여기로
          옮겼다 — 계정을 끝내는 동작이라 계정을 여는 화면에 딸리는 게 맞고, 최상위에
          두면 요금제·용량을 보러 스크롤을 내린 손 끝에 탈퇴가 놓인다.

          위계는 카드를 나누는 대신 **색으로** 남긴다 — 로그아웃은 되돌릴 수 있고 탈퇴는 못
          되돌리므로, 나란히 같은 빨강으로 두면 동급으로 읽히고 오탭 위험이 생긴다. 탈퇴는
          INK-muted 로 낮춰서 찾는 사람은 찾되 눈에 먼저 걸리지는 않게 한다.
          되돌릴 수 없는 쪽이라 누른 뒤에도 모달로 한 번 더 확인받는다.
        */}
        <SettingsList>
          <SettingsRow
            title={isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            action="danger"
            // 요청 중에는 중복 클릭 방지
            disabled={isLoggingOut}
            onClick={() => requestLogout()}
          />
          <SettingsRow
            title="회원탈퇴"
            action="quiet"
            onClick={() => setIsWithdrawModalOpen(true)}
          />
        </SettingsList>
      </div>

      {/*
        ⚠️ **금색 플랜 배지가 아바타 밑에 있었다.** 뺐다 — 이 화면에서 누를 수도 바꿀 수도
        없는 값인데, 마이페이지의 스탯 타일과 `구독` 줄이 이미 같은 것을 말하고 있어
        한 흐름에서 요금제를 세 번 읽게 된다. 요금제를 다루는 자리는 `/premium` 이다.
      */}

      {isNicknameSheetOpen && profile && (
        <NicknameEditSheet
          currentNickname={profile.nickname}
          isSaving={isSaving}
          onClose={() => setIsNicknameSheetOpen(false)}
          onSubmit={handleSaveNickname}
        />
      )}

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
