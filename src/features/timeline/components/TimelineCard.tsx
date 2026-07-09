import { useState } from "react";
import type { TimelineRecord } from "../types/timeline.types";
import smileyIcon from "../assets/smiley.svg";
import trashIcon from "../assets/trashcan.svg";

// ISO 시각 문자열 → "09:30"
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

/**
 *
 * Figma 색상:
 *   카드 보더 #8BCC6A / 썸네일 #D9D9D9 / 기록됨 배지 #EDEDED·#4F4F4F
 *   사진 라벨 #D9D9D9 / 삭제확인 줄 #FFC6C6 / 삭제 버튼 #FF0000
 */
interface Props {
  record: TimelineRecord;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function TimelineCard({ record, onDelete, isDeleting }: Props) {
  const [confirming, setConfirming] = useState(false);
  const hasPhoto = !!record.thumbnailUrl; // 사진 유무 

  return (
    <li className="mx-4 my-2 overflow-hidden rounded-2xl border border-[#8BCC6A] bg-white">
      <div className="flex items-center gap-3 p-3">
        {/* 좌: 썸네일 + 시간 */}
        <div className="flex w-11 flex-shrink-0 flex-col items-center gap-1">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-[#D9D9D9]">
            {hasPhoto ? (
              <img
                src={record.thumbnailUrl as string}
                alt={record.placeName}
                className="h-11 w-11 object-cover"
              />
            ) : (
              // 사진 없는 기록 플레이스홀더: 스마일 아이콘 
              <img src={smileyIcon} alt="" className="h-6 w-6" />
            )}
          </div>
          <span className="text-[11px] italic text-black">
            {formatTime(record.recordedAt)}
          </span>
        </div>

        {/* 중: 장소명 + 코멘트 (+ 우측 상단 기록됨 배지) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-semibold text-black">
              {record.placeName}
            </p>
            <span className="flex-shrink-0 rounded bg-[#EDEDED] px-2 py-0.5 text-[10px] text-[#4F4F4F]">
              기록됨
            </span>
          </div>
          <p className="truncate text-[13px] text-black">{record.comment}</p>
        </div>

        {/* 우: 사진 라벨 (사진 있는 기록만) */}
        {hasPhoto && (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-[#D9D9D9] text-xs text-black">
            사진
          </div>
        )}
      </div>

      {/* 하단 삭제 영역: confirming 에 따라 [확인 줄] 또는 [삭제 버튼] */}
      {confirming ? (
        <div className="flex items-center justify-between gap-2 bg-[#FFC6C6] px-3 py-2">
          <span className="text-xs text-black">이 기록을 삭제할까요?</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-[#D9D9D9] bg-white px-3 py-1 text-xs text-black"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              disabled={isDeleting}
              className="rounded bg-[#FF0000] px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center justify-center gap-1 border-t border-[#EDEDED] py-1.5 text-xs text-[#4F4F4F]"
        >
          <img src={trashIcon} alt="" className="h-3.5 w-3.5" /> 삭제
        </button>
      )}
    </li>
  );
}
