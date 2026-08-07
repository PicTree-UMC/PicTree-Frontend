import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar, SettingsList, SettingsRow, useToast } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { useMyProfile } from "./hooks/useMyProfile";
import { useUpdateMyProfile } from "./hooks/useUpdateMyProfile";
import { getPlanLabel } from "./lib/plan";
import { ProfileImageSheet } from "./components/ProfileImageSheet";
import treeIcon from "./assets/icons/tree.svg";
import cardImage from "./assets/icons/card3d.jpg";

/** 서버 `UpdateUserRequestDto` 의 제약. 넘기면 400 이 떨어진다. */
const NICKNAME_MAX = 50;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section>
      <h2 className="mb-2 pl-1 text-[15px] font-medium text-[#5B6B38]">{label}</h2>
      {children}
      {hint && <p className="mt-1.5 pl-1 text-[13px] text-[#60655C]">{hint}</p>}
    </section>
  );
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: profile, isPending, isError, refetch } = useMyProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateMyProfile();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);
  /**
   * 입력 중인 닉네임. `null` 이면 아직 손대지 않은 상태로, 서버 값을 그대로 보여준다.
   * 빈 문자열과 구분해야 해서 undefined 가 아니라 null 을 쓴다.
   */
  const [draftNickname, setDraftNickname] = useState<string | null>(null);

  const nickname = draftNickname ?? profile?.nickname ?? "";
  const trimmed = nickname.trim();
  const hasImage = Boolean(profile?.profileImageUrl) && !isAvatarBroken;

  const isTooLong = trimmed.length > NICKNAME_MAX;
  const isEmpty = trimmed.length === 0;
  const isChanged = Boolean(profile) && trimmed !== profile?.nickname;
  const canSave = isChanged && !isEmpty && !isTooLong && !isSaving;

  const handleSave = () => {
    if (!canSave) return;

    updateProfile(
      { nickname: trimmed },
      {
        onSuccess: () => {
          setDraftNickname(null);
          showToast("내 정보를 수정했어요.", "success");
        },
      },
    );
  };

  const handleRemoveImage = () => {
    setIsSheetOpen(false);
    // null 이 곧 "이미지 제거" 다 (서버 DTO 주석에 명시)
    updateProfile(
      { profileImageUrl: null },
      {
        onSuccess: () => {
          setIsAvatarBroken(false);
          showToast("기본 이미지로 바꿨어요.", "success");
        },
      },
    );
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      {/* pt-4 는 safe-area 가 없어 노치 기기에서 제목이 가려졌다(§3). */}
      <header className="px-5 pb-2 pt-header">
        <NavBar onBack={() => navigate(-1)} title="내 정보" />
      </header>

      {/*
        아바타는 종전에 `-mt-12` 로 초록 밴드에 걸쳐 앉아 있었고, `border-4` 크림 테두리가
        밴드에서 오려낸 것처럼 보이게 하는 장치였다. 밴드가 없어졌으니 둘 다 뺀다 —
        크림 위 크림 테두리는 아무 일도 안 하면서 아바타만 8px 작아 보이게 한다.
      */}
      <div className="mt-4 flex flex-col items-center px-5">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#F6F0D7]">
            {profile?.profileImageUrl && !isAvatarBroken ? (
              <img
                src={profile.profileImageUrl}
                alt=""
                onError={() => setIsAvatarBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={treeIcon} alt="" className="h-11 w-11" />
            )}
          </div>

          {/*
            사진이 없으면 버튼을 아예 띄우지 않는다. 지금 할 수 있는 동작이
            "제거" 뿐이라, 기본 이미지 상태에서는 눌러도 할 일이 없다.
            업로드 API 가 생기면 이 조건을 풀고 "사진 선택" 을 붙이면 된다.
          */}
          {hasImage && (
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              aria-label="프로필 사진 제거"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFFCEF] bg-[#5B6B38] text-[14px] text-white"
            >
              ✎
            </button>
          )}
        </div>

        {profile && (
          <span className="mt-2 inline-block rounded-xl bg-[#DDBF68] px-3 py-0.5 text-[13px] font-medium text-[#2C3930]">
            {getPlanLabel(profile.currentPlan)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 px-5 pt-6">
        {/*
          조회에 실패하면 빈 폼만 남아 왜 비었는지 알 수 없다. 저장 버튼은 어차피
          막히므로(값이 없어 변경 판정이 안 선다) 잘못 저장될 위험은 없지만,
          사유와 재시도 수단은 있어야 한다.
        */}
        {isError && (
          <div className="rounded-xl border border-[#DC2626] bg-white px-5 py-4 text-center">
            <p className="text-[14px] text-[#DC2626]">내 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        <Field
          label="닉네임"
          hint={
            isEmpty
              ? "닉네임을 입력해주세요."
              : isTooLong
                ? `${NICKNAME_MAX}자까지 쓸 수 있어요.`
                : undefined
          }
        >
          <div
            className={`flex items-center gap-2 rounded-xl border bg-white px-5 py-3 ${
              isEmpty || isTooLong ? "border-[#DC2626]" : "border-[#ECECEC]"
            }`}
          >
            <input
              value={nickname}
              onChange={(event) => setDraftNickname(event.target.value)}
              disabled={isPending}
              aria-label="닉네임"
              placeholder="닉네임을 입력해주세요"
              className="min-w-0 flex-1 text-[17px] font-medium text-[#2C3930] outline-none placeholder:font-normal placeholder:text-[#B4B4B4]"
            />
            <span className="shrink-0 text-[13px] text-[#60655C]">
              {trimmed.length}/{NICKNAME_MAX}
            </span>
          </div>
        </Field>

        <Field
          label="이메일"
          hint="소셜 계정에서 가져온 값이라 앱에서는 바꿀 수 없어요."
        >
          <div className="rounded-xl border border-[#ECECEC] bg-[#F6F0D7] px-5 py-3">
            <p className="text-[17px] font-medium text-[#60655C]">
              {/* 카카오는 이메일 동의를 안 하면 null 로 온다 */}
              {profile?.email ?? "등록된 이메일이 없어요"}
            </p>
          </div>
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="mt-1 h-12 rounded-xl bg-[#5B6B38] text-[17px] font-medium text-white disabled:bg-[#D9D9D9] disabled:text-[#60655C]"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </button>

        {/*
          결제 수단은 이 화면의 폼과 **다른 묶음**이다 — 저장하기가 닫는 것은 위의 닉네임·
          이메일뿐이고, 이 줄은 다른 화면으로 나가는 문이다. 그래서 저장 버튼 아래에
          그룹 리스트로 따로 세운다(iOS 설정이 폼과 이동 줄을 가르는 방식).

          프로필 최상위 목록이 아니라 여기 있는 이유: 카드는 평생 한두 번 여는 화면이라
          최상위 줄을 하나 차지할 만큼 자주 쓰이지 않고, 내용상 '내 정보' 에 딸린 값이다.
        */}
        <SettingsList className="mt-3">
          <SettingsRow
            image={cardImage}
            title="결제 수단"
            onClick={() => navigate(ROUTES.paymentMethods)}
          />
        </SettingsList>
      </div>

      {isSheetOpen && (
        <ProfileImageSheet
          onRemove={handleRemoveImage}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </div>
  );
}
