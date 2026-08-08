import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsList, SettingsRow, useToast } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMyProfile } from "../hooks/useMyProfile";
import { useUpdateMyProfile } from "../hooks/useUpdateMyProfile";
import { useWithdraw } from "../hooks/useWithdraw";
import { WithdrawModal } from "../components/WithdrawModal";
import cardImage from "../assets/icons/card3d.jpg";

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

/**
 * 마이페이지 ③ 프로필 탭 — 내 개인정보. 옛 `/profile/edit` 페이지가 통째로 여기 들어왔다.
 *
 * **아바타와 플랜 뱃지는 없다.** 아바타는 네 탭이 공유하는 머리글(`ProfileHeader`)로
 * 올라갔고 — 사진 제거 버튼도 같이 따라갔다 — 플랜 이름은 메인 탭의 요금제 타일과
 * 플랜 탭이 이미 두 번 말한다. 이 탭은 **바꿀 수 있는 값**만 든다.
 *
 * 담기는 것: 닉네임(유일하게 수정 가능) · 이메일(읽기 전용) · 결제 수단 · 계정에서
 * 빠져나가는 동작 둘.
 */
export function AccountTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: profile, isPending, isError, refetch } = useMyProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateMyProfile();
  const { mutate: requestLogout, isPending: isLoggingOut } = useLogout();
  const { mutate: requestWithdraw, isPending: isWithdrawing } = useWithdraw();

  // 되돌릴 수 없는 동작이라 한 번 더 확인받는다
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  /**
   * 입력 중인 닉네임. `null` 이면 아직 손대지 않은 상태로, 서버 값을 그대로 보여준다.
   * 빈 문자열과 구분해야 해서 undefined 가 아니라 null 을 쓴다.
   */
  const [draftNickname, setDraftNickname] = useState<string | null>(null);

  const nickname = draftNickname ?? profile?.nickname ?? "";
  const trimmed = nickname.trim();

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

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      {/*
        조회에 실패하면 빈 폼만 남아 왜 비었는지 알 수 없다. 저장 버튼은 어차피
        막히므로(값이 없어 변경 판정이 안 선다) 잘못 저장될 위험은 없지만,
        사유와 재시도 수단은 있어야 한다.

        ⚠️ 머리글(`ProfileHeader`)도 같은 쿼리를 보고 사유를 그린다. 중복처럼 보이지만
        저쪽은 닉네임 자리를 메우는 것이고 이쪽은 **폼이 왜 비었나** 를 말한다 — 머리글은
        스크롤로 올라가 사라질 수 있고, 그러면 이 탭에 이유가 하나도 안 남는다.
      */}
      {isError && (
        <div className="rounded-xl border border-[#DC2626] bg-white px-5 py-4 text-center">
          <p className="text-[13px] text-[#DC2626]">내 정보를 불러오지 못했어요.</p>
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

      <Field label="이메일" hint="소셜 계정에서 가져온 값이라 앱에서는 바꿀 수 없어요.">
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
        결제 수단은 이 탭의 폼과 **다른 묶음**이다 — 저장하기가 닫는 것은 위의 닉네임·
        이메일뿐이고, 이 줄은 다른 화면으로 나가는 문이다. 그래서 저장 버튼 아래에
        그룹 리스트로 따로 세운다(iOS 설정이 폼과 이동 줄을 가르는 방식).

        플랜 탭이 아니라 여기 있는 이유: 카드는 구독보다 오래 살고(해지해도 남는다)
        만료·교체가 구독과 무관하게 일어난다. 내 계정에 딸린 값이지 요금제에 딸린 값이 아니다.
      */}
      <SettingsList className="mt-3">
        <SettingsRow
          image={cardImage}
          title="결제 수단"
          onClick={() => navigate(ROUTES.paymentMethods)}
        />
      </SettingsList>

      {/*
        계정에서 빠져나가는 동작 둘.

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
