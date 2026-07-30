import alertIcon from "../assets/icons/alert.svg";

/** 취소하면 잃는 혜택. 시안(WF-017)의 문구를 그대로 쓴다. */
const LOSING_BENEFITS = ["용량 업그레이드", "AI 블로그 자동 생성", "광고 제거"];

interface Props {
  onKeep: () => void;
  onCancel: () => void;
}

/** 구독 취소 확인 모달. 되돌릴 수 없어 무엇을 잃는지 먼저 보여준다. */
export function CancelSubscriptionModal({ onKeep, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
      onClick={onKeep}
    >
      <div
        role="dialog"
        aria-label="구독 취소 확인"
        className="w-full max-w-[352px] rounded-[20px] bg-[#FFFCEF] px-6 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={alertIcon} alt="" className="mx-auto h-[50px] w-[50px]" />

        <p className="mt-3 text-center text-xl font-bold text-black">
          정말 구독을 취소할까요?
        </p>
        <p className="mt-1 text-center text-xs text-[#2C3930]">
          구독을 취소하면 다음 혜택을 잃게 됩니다
        </p>

        <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border-2 border-[#C5D89D] bg-white py-4 text-center text-sm font-semibold text-[#111]">
          {LOSING_BENEFITS.map((benefit) => (
            <p key={benefit}>{benefit}</p>
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-4">
          <button
            type="button"
            onClick={onKeep}
            className="h-[38px] w-[120px] rounded-xl bg-[#ECECEC] text-base font-semibold text-[#2C3930]"
          >
            구독 유지
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-[38px] w-[120px] rounded-xl bg-[#FF5858] text-base font-semibold text-white"
          >
            구독 취소
          </button>
        </div>
      </div>
    </div>
  );
}
