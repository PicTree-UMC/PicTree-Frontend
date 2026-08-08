import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { useSessionExpiredRedirect } from "@/features/auth/hooks/useSessionExpiredRedirect";
import { useMyProfile } from "../hooks/useMyProfile";
import { useUpdateMyProfile } from "../hooks/useUpdateMyProfile";
import { getApiErrorMessage, getProfileErrorKind } from "../lib/profileError";
import { ProfileImageSheet } from "./ProfileImageSheet";
import treeIcon from "../assets/icons/tree.svg";

/**
 * 마이페이지 머리글 — 아바타와 닉네임. **네 탭이 공유한다.**
 *
 * **톱니(설정) 버튼은 없다.** 레퍼런스는 오른쪽 위에 하나 달고 있는데, 그 아이콘이 여는
 * 것이 여기서는 전부 탭으로 나와 있다 — 열 것이 없는 버튼이다.
 *
 * **이메일도 안 쓴다.** 종전 머리글은 닉네임 아래 이메일을 붙였는데, 이제 프로필 탭이
 * 이메일 칸을 제대로 갖는다(바꿀 수 없는 값이라는 안내까지 함께). 머리글이 같은 값을
 * 다시 말하면 네 탭 중 한 탭에서만 중복이 생긴다.
 *
 * **사진 제거(✎)는 여기로 올라왔다.** 옛 '내 정보' 페이지의 아바타에 붙어 있던 버튼이다.
 * 아바타가 머리글로 올라오면서 프로필 탭에는 아바타가 없어졌으니, 손댈 수 있는 자리도
 * 그림이 있는 쪽으로 따라온다.
 *
 * 조회 실패 갈래(만료·정지·그 밖)를 여기서 그리는 이유: 닉네임이 못 오면 어느 탭을 열든
 * 머리글이 비고, 사유를 말할 자리가 여기뿐이다.
 */
export function ProfileHeader() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  /**
   * `isLoading` 대신 `isPending` 을 쓴다. react-query v5 의 `isLoading` 은
   * `isPending && isFetching` 이라, 토큰이 없어 쿼리가 꺼진 동안 false 가 된다.
   * 그러면 데이터가 없는 채로 성공 분기가 그려져 닉네임이 빈 칸으로 남는다.
   */
  const { data: profile, isPending, isError, error, refetch } = useMyProfile();
  const { mutate: updateProfile } = useUpdateMyProfile();

  const errorKind = isError ? getProfileErrorKind(error) : null;

  // 401 은 화면에서 처리할 수 없다 — 토큰을 비우고 로그인 화면으로 보낸다.
  useSessionExpiredRedirect(errorKind === "session-expired");

  /**
   * 프로필 이미지 로드 실패 여부.
   * URL 이 내려와도 실제로 못 불러오는 경우(만료된 CDN 링크 등)가 있어,
   * 이때 깨진 이미지 아이콘 대신 기본 나무 아이콘으로 떨어뜨린다.
   */
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 못 불러온 이미지는 없는 것으로 친다 — 아래 두 갈래가 같은 값 하나만 보게 한다.
  const imageUrl = isAvatarBroken ? null : (profile?.profileImageUrl ?? null);

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
    <header className="flex flex-col items-center px-5 pt-header">
      <div className="relative">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[#F6F0D7]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              onError={() => setIsAvatarBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={treeIcon} alt="" className="size-11" />
          )}
        </div>

        {/*
          사진이 없으면 버튼을 아예 띄우지 않는다. 지금 할 수 있는 동작이 "제거" 뿐이라,
          기본 이미지 상태에서는 눌러도 할 일이 없다. 업로드 API 가 생기면 이 조건을 풀고
          "사진 선택" 을 붙이면 된다.
        */}
        {imageUrl && (
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            aria-label="프로필 사진 제거"
            className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-[#FFFCEF] bg-[#5B6B38] text-[14px] text-white"
          >
            ✎
          </button>
        )}
      </div>

      {isPending ? (
        // 스켈레톤 — 닉네임 자리를 그대로 잡아 아래 탭 줄이 튀지 않게 한다
        <div className="mt-3 h-6 w-28 animate-pulse rounded bg-[#F6F0D7]" />
      ) : errorKind === "session-expired" ? (
        // useSessionExpiredRedirect 가 곧 로그인 화면으로 보낸다
        <p className="mt-3 text-[15px] font-medium text-[#2C3930]">
          로그인 화면으로 이동합니다
        </p>
      ) : errorKind === "account-unavailable" ? (
        // 정지·삭제된 계정. 재시도해도 결과가 바뀌지 않으니 사유만 알린다.
        <div className="mt-3 flex flex-col items-center">
          <p className="text-[15px] font-medium text-[#2C3930]">
            {getApiErrorMessage(error, "계정 정보를 확인할 수 없어요")}
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
            {getApiErrorMessage(error, "정보를 불러오지 못했어요")}
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
        <p className="mt-3 text-[20px] font-medium text-[#2C3930]">{profile?.nickname}</p>
      )}

      {isSheetOpen && (
        <ProfileImageSheet
          onRemove={handleRemoveImage}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </header>
  );
}
