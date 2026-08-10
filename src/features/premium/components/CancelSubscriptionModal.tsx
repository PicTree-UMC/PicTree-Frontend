import alertIcon from "../assets/icons/alert.svg";

/*
  구 구독 관리 화면(`profile/SubscriptionPage`)과 함께 쓰던 모달이라 profile 밑에 있었다.
  그 화면이 지워지면서 해지 입구가 `SubscriptionCancelSection` 하나만 남아 premium 으로
  옮겼다 — 그쪽 주석에 예고돼 있던 이동이다.
*/

/** 취소하면 잃는 혜택. 시안(WF-017)의 문구를 그대로 쓴다. */
const LOSING_BENEFITS = ["용량 업그레이드", "AI 블로그 자동 생성", "광고 제거"];

interface Props {
  onKeep: () => void;
  onCancel: () => void;
  /** 취소 요청이 나가 있는 동안 true. 응답이 올 때까지 모달이 그대로 떠 있어서 필요하다. */
  isPending?: boolean;
}

/** 구독 취소 확인 모달. 되돌릴 수 없어 무엇을 잃는지 먼저 보여준다. */
export function CancelSubscriptionModal({ onKeep, onCancel, isPending }: Props) {
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

        <p className="mt-3 text-center text-[20px] font-medium text-[#2C3930]">
          정말 구독을 취소할까요?
        </p>
        <p className="mt-1 text-center text-[13px] text-[#2C3930]">
          구독을 취소하면 다음 혜택을 잃게 됩니다
        </p>

        <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border border-line-soft bg-white py-4 text-center text-[13px] font-medium text-[#2C3930]">
          {LOSING_BENEFITS.map((benefit) => (
            <p key={benefit}>{benefit}</p>
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-4">
          <button
            type="button"
            onClick={onKeep}
            disabled={isPending}
            className="h-[38px] w-[120px] rounded-xl bg-line-soft text-[15px] font-medium text-[#2C3930] disabled:opacity-60"
          >
            구독 유지
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-[38px] w-[120px] rounded-xl bg-[#DC2626] text-[15px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? "처리 중..." : "구독 취소"}
          </button>
        </div>
      </div>
    </div>
  );
}
