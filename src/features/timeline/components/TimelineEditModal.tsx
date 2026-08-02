import { useState } from "react";
import { createPortal } from "react-dom";

import { EmojiPicker } from "@/shared/components";
import type { TimelineRecord } from "../types/timeline.types";

// ISO → "2026.04.01"
const formatDate = (iso: string): string => {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const p = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

interface Props {
  record: TimelineRecord;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: { title: string; content: string }) => void;
}

/**
 * 기록 수정 모달. 시안(`기록 수정`) 기준.
 *
 * ⚠️ 기분 이모지는 화면에만 있고 저장되지 않는다. `PATCH /timelines/{id}` 의
 * 요청 필드는 treeId·title·content·category·visitedAt 뿐이라 담아 보낼 자리가 없다
 * (서버의 `mood` 는 나무에 붙어 있고 타임라인 수정으로는 못 건드린다).
 * 백엔드에 필드가 생기면 `onSave` 에 얹어 보내면 된다.
 */
export function TimelineEditModal({ record, isSaving = false, onClose, onSave }: Props) {
  const [title, setTitle] = useState(record.placeName);
  const [content, setContent] = useState(record.comment);
  const [emoji, setEmoji] = useState<string | null>(null);

  const recordedDate = formatDate(record.recordedAt);
  // 제목이 비면 서버가 400 을 낸다 (title 은 필수·1자 이상)
  const canSave = title.trim().length > 0 && !isSaving;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="기록 수정"
    >
      <div
        className="w-full max-w-[390px] overflow-hidden rounded-[20px] bg-[#FFFCEF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 제목 */}
        <div className="relative flex items-center justify-center px-[19px] pb-2 pt-4">
          <h2 className="text-[20px] font-medium text-[#2C3930]">기록 수정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-[19px] top-1/2 -translate-y-1/2 text-[22px] leading-none text-[#2C3930]"
          >
            ✕
          </button>
        </div>

        {/* 장소명 */}
        <div className="flex flex-col gap-2.5 px-[19px] py-3">
          <label htmlFor="edit-title" className="text-[16px] font-medium text-[#2C3930]">
            장소명
          </label>
          <input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="h-[45px] w-full rounded-[20px] border-2 border-[#788F4A] bg-[#FFFDFD] px-4 text-center text-[14px] font-medium text-[#2C3930] outline-none"
          />
        </div>

        {/* 기분 이모지 */}
        <div className="flex flex-col gap-1.5 px-4 py-1.5">
          <p className="text-[16px] font-medium text-[#2C3930]">기분 이모지</p>
          <EmojiPicker variant="modal" selected={emoji} onSelect={setEmoji} />
        </div>

        {/* 한줄평 */}
        <div className="flex flex-col gap-2.5 px-[19px] py-3">
          <label htmlFor="edit-content" className="text-[16px] font-medium text-[#2C3930]">
            한줄평
          </label>
          <input
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            className="h-[45px] w-full rounded-[20px] border-2 border-[#788F4A] bg-[#FFFDFD] px-4 text-center text-[14px] font-medium text-[#2C3930] outline-none"
          />
        </div>

        {/* 날짜는 수정 대상이 아니다 — 서버에 visitedAt 을 보내지 않는다 */}
        <p className="mx-auto w-[250px] text-center text-[13px] font-medium leading-5 tracking-[-0.3px] text-[#60655C]">
          날짜는 기록 시점 그대로 유지됩니다.
          {recordedDate && ` (${recordedDate})`}
        </p>

        <div className="flex items-center justify-center gap-[21px] px-[19px] pb-5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#E6E6E6] text-[16px] font-medium tracking-[0.8px] text-[#2C3930]"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({ title: title.trim(), content: content.trim() })}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#C5D89D] text-[16px] font-medium tracking-[0.8px] text-[#2C3930] disabled:opacity-50"
          >
            {isSaving ? "저장 중" : "저장하기"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
