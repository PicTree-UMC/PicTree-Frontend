import type { TimelineRecord } from "../types/timeline.types";
import { TrashIcon } from "@/shared/components";

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
        className="w-[350px] rounded-[20px] bg-cream px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <TrashIcon className="mx-auto h-[30px] w-[30px] text-error" />
        {/*
          ⚠️ 문구가 '타임라인 제거' 에서 '장소 삭제' 로 바뀐 이유 (#123).

          통합 전에는 기록만 지워지고 나무는 지도에 남았다. 지금은 기록이 곧 나무라
          `DELETE /trees/{treeId}` 가 나가고 **지도의 장소까지 함께 사라진다.**
          예전 문구를 그대로 두면 "타임라인에서만 빠지겠지" 로 읽고 누르게 된다 —
          되돌릴 방법이 없는 동작이라 결과를 먼저 말해야 한다.
        */}
        <p className="mt-2 text-xl font-medium text-black">이 장소를 삭제할까요?</p>
        <p className="mt-1 text-[13px] text-ink">{record.placeName}</p>
        <p className="mt-2 text-[13px] text-error">
          지도에서도 사라지고 되돌릴 수 없어요
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-[38px] w-[92px] rounded-[12px] bg-line-soft text-base font-medium text-ink"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-[38px] w-[92px] rounded-[12px] bg-error text-base font-medium text-white disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
