import type { TimelineRecord } from "../types/timeline.types";
import trashIcon from "../assets/trashCan.svg";

interface Props {
  record: TimelineRecord;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteRecordModal({
  record,
  isDeleting,
  onCancel,
  onConfirm,
}: Props) {
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
        <p className="mt-2 text-xl font-bold text-black">
          이 타임라인을 제거할까요?
        </p>
        <p className="mt-1 text-[13px] text-[#2C3930]">{record.placeName}</p>
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
            disabled={isDeleting}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#FF5858] text-base font-semibold text-white disabled:opacity-50"
          >
            제거
          </button>
        </div>
      </div>
    </div>
  );
}
