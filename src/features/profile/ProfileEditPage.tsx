import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/shared/components";
import { useMyProfile } from "./hooks/useMyProfile";
import { useUpdateMyProfile } from "./hooks/useUpdateMyProfile";
import { getPlanLabel } from "./lib/plan";
import { ProfileImageSheet } from "./components/ProfileImageSheet";
import treeIcon from "./assets/icons/tree.svg";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";

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
      <h2 className="mb-2 pl-1 text-[15px] font-medium text-[#9CAB84]">{label}</h2>
      {children}
      {hint && <p className="mt-1.5 pl-1 text-[13px] text-[#8D8D8D]">{hint}</p>}
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
      <header className="bg-[#C5D89D] px-5 pb-16 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-[20px] font-medium text-black">내 정보</h1>
        </div>
      </header>

      {/* 아바타 — 헤더 밴드에 걸쳐 앉힌다 (마이페이지와 같은 계열의 구성) */}
      <div className="-mt-12 flex flex-col items-center px-5">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#FFFCEF] bg-[#F6F0D7]">
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
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFFCEF] bg-[#89986D] text-[14px] text-white"
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
          <div className="rounded-xl border-2 border-[#FF8A8A] bg-white px-5 py-4 text-center">
            <p className="text-[14px] text-[#FF5858]">내 정보를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#89986D] px-4 py-1.5 text-[13px] font-medium text-white"
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
            className={`flex items-center gap-2 rounded-xl border-2 bg-white px-5 py-3 ${
              isEmpty || isTooLong ? "border-[#FF8A8A]" : "border-[#C5D89D]"
            }`}
          >
            <input
              value={nickname}
              onChange={(event) => setDraftNickname(event.target.value)}
              disabled={isPending}
              aria-label="닉네임"
              placeholder="닉네임을 입력해주세요"
              className="min-w-0 flex-1 text-[17px] font-medium text-[#111] outline-none placeholder:font-normal placeholder:text-[#B5B5B5]"
            />
            <span className="shrink-0 text-[13px] text-[#8D8D8D]">
              {trimmed.length}/{NICKNAME_MAX}
            </span>
          </div>
        </Field>

        <Field
          label="이메일"
          hint="소셜 계정에서 가져온 값이라 앱에서는 바꿀 수 없어요."
        >
          <div className="rounded-xl border-2 border-[#E6E1CC] bg-[#F7F5EC] px-5 py-3">
            <p className="text-[17px] font-medium text-[#8D8D8D]">
              {/* 카카오는 이메일 동의를 안 하면 null 로 온다 */}
              {profile?.email ?? "등록된 이메일이 없어요"}
            </p>
          </div>
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="mt-1 h-12 rounded-xl bg-[#89986D] text-[17px] font-medium text-white disabled:bg-[#D5D5D5] disabled:text-[#8D8D8D]"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
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
