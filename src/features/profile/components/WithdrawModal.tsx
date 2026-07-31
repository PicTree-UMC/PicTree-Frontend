import trashIcon from "../assets/icons/trashLarge.svg";

interface Props {
  isWithdrawing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 회원 탈퇴 확인 모달.
 *
 * 되돌릴 수 없는 동작이라 무엇이 사라지는지 한 줄로 못 박아 준다.
 * 생김새는 타임라인 제거 모달(`DeleteRecordModal`)과 같은 규격을 따른다 —
 * 두 모달이 하나로 합쳐지면 이 파일은 그쪽으로 흡수하면 된다.
 */
export function WithdrawModal({ isWithdrawing, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
      onClick={onCancel}
    >
      <div
        className="w-[350px] rounded-[20px] bg-[#FFFCEF] px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={trashIcon} alt="" className="mx-auto h-[30px] w-[30px]" />
        <p className="mt-2 text-xl font-bold text-black">정말 탈퇴할까요?</p>
        <p className="mt-1 text-[13px] leading-[18px] text-[#2C3930]">
          지금까지 기록한 나무와 타임라인이 모두 사라지고
          <br />
          되돌릴 수 없어요.
        </p>

        {/*
          재가입 불가는 "되돌릴 수 없다" 보다 한 단계 더 센 제약이라 따로 떼어
          강조한다. 탈퇴해도 계정 행은 남고(status: WITHDRAWN) 소셜 계정 연결도
          그대로라, 같은 카카오·구글 계정으로 로그인하면 서버가 USER_UNAVAILABLE
          로 막는다. 새 계정으로 시작할 방법이 지금은 없다.
        */}
        <p className="mt-3 rounded-[12px] bg-[#FFECEC] px-4 py-3 text-[13px] font-semibold leading-[18px] text-[#FF5858]">
          탈퇴하면 같은 계정으로
          <br />
          다시 가입할 수 없어요.
        </p>

        <div className="mt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#E6E6E6] text-base font-semibold text-[#2C3930]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isWithdrawing}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#FF5858] text-base font-semibold text-white disabled:opacity-50"
          >
            {isWithdrawing ? "처리 중" : "탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}
