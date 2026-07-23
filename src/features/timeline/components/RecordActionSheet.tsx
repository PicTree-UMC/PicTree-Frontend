import type { TimelineRecord } from "../types/timeline.types";
import penIcon from "../assets/penLine.svg";
import photoIcon from "../assets/photo.svg";
import starIcon from "../assets/star.svg";
import trashIcon from "../assets/trashCan.svg";

// ISO → "2026년 4월 1일 09:30"
const formatFull = (iso: string): string => {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
};

interface Props {
  record: TimelineRecord;
  onClose: () => void;
  onEdit: () => void;
  onChangePhoto: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}

function ActionRow({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-1 py-2.5 text-left"
    >
      <img src={icon} alt="" className="h-[22px] w-[22px] flex-shrink-0" />
      <span className="text-sm font-bold text-black">{label}</span>
    </button>
  );
}

export function RecordActionSheet({
  record,
  onClose,
  onEdit,
  onChangePhoto,
  onFavorite,
  onDelete,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-[20px] bg-[#FFFCEF] px-6 pb-8 pt-3 shadow-[0px_-8px_24px_0px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="mx-auto mb-4 h-[5px] w-[134px] rounded-full bg-[#111]" />

        {/* 헤더 카드 */}
        <div className="mb-4 flex items-center gap-4">
          <div className="h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-[20px] bg-[rgba(197,216,157,0.8)]">
            {record.thumbnailUrl && (
              <img
                src={record.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-[#111]">
              {record.placeName}
            </p>
            <p className="text-xs font-medium text-[#2C3930]">
              {formatFull(record.recordedAt)}
            </p>
          </div>
        </div>

        {/* 액션 카드 */}
        <div className="rounded-[18px] bg-white px-4 py-1 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.05)]">
          <ActionRow icon={penIcon} label="기록 수정" onClick={onEdit} />
          <ActionRow
            icon={photoIcon}
            label="사진 보기 / 사진 변경"
            onClick={onChangePhoto}
          />
          <ActionRow icon={starIcon} label="즐겨찾기 추가" onClick={onFavorite} />
        </div>

        {/* 삭제하기 */}
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#FFD5D5] py-3.5 shadow-[0px_4px_14px_0px_rgba(0,0,0,0.05)]"
        >
          <img src={trashIcon} alt="" className="h-[22px] w-[22px]" />
          <span className="text-sm font-bold text-[#FF5858]">삭제하기</span>
        </button>
      </div>
    </div>
  );
}
