import { useTimelineDetail, useTimelineImages } from "../hooks/useTimelineDetail";
import type { TimelineRecord } from "../types/timeline.types";
import penIcon from "../assets/penLine.svg";
import trashIcon from "../assets/trashcan.svg";

/** ISO → "2026년 4월 1일 09:30". 값이 비어 있으면 표시하지 않는다. */
const formatFull = (iso?: string | null): string | null => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
};

const CATEGORY_LABEL: Record<string, string> = {
  VISIT: "방문",
  FOOD: "음식",
  SHOPPING: "쇼핑",
  ACTIVITY: "활동",
  ETC: "기타",
};

interface Props {
  record: TimelineRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="w-[64px] shrink-0 text-[13px] text-[#60655C]">{label}</span>
      <span className="flex-1 text-[13px] text-[#2C3930]">{value}</span>
    </div>
  );
}

/**
 * 사진 아래 "더보기" 로 여는 상세 시트.
 *
 * 목록이 이미 가진 값으로 먼저 그리고, `GET /timelines/{id}` 가 돌아오면 사진 등
 * 목록에 없는 값을 채운다 — 열자마자 빈 화면을 보여주지 않으려는 것이다.
 * 상세 호출이 실패해도 목록 값만으로 읽을 수 있으므로 에러로 막지 않는다.
 */
export function RecordDetailSheet({ record, onClose, onEdit, onDelete }: Props) {
  const { data: detail } = useTimelineDetail(record.id);
  const { data: images } = useTimelineImages(record.id, record.treeId);

  /*
    이 기록에 붙은 사진이 있으면 그걸 쓰고, 없으면 목록에서 이어 온 나무 대표
    사진으로 떨어진다.

    ⚠️ `record.defaultImage` 는 쓰지 않는다 — `"DEFAULT_1"` 같은 식별자라
    URL 이 아니다. 예전에 여기 있어서 사진이 깨져 보였다.
  */
  const photo =
    images?.[0]?.imageUrl ?? record.thumbnailUrl ?? "/apple-touch-icon.jpg";

  const visitedAt = formatFull(record.recordedAt);
  const createdAt = formatFull(record.createdAt);
  const category = record.category ? CATEGORY_LABEL[record.category] ?? record.category : null;
  const treeName = detail?.treeName ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`${record.placeName} 상세`}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[20px] bg-[#FFFCEF] px-6 pb-8 pt-3"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 손잡이 */}
        <div className="mx-auto mb-4 h-[5px] w-[134px] rounded-full bg-[#D9D9D9]" />

        <img
          src={photo}
          alt=""
          className="mb-4 aspect-square w-full object-cover"
        />

        <h2 className="text-xl font-bold text-black">{record.placeName}</h2>
        {record.comment && (
          <p className="mt-1 text-[14px] leading-[20px] text-[#2C3930]">
            {record.comment}
          </p>
        )}

        <div className="mt-4 border-t border-[#E6E1CC] pt-3">
          {visitedAt && <InfoRow label="방문" value={visitedAt} />}
          {createdAt && <InfoRow label="등록" value={createdAt} />}
          {category && <InfoRow label="분류" value={category} />}
          {treeName && <InfoRow label="나무" value={treeName} />}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#C5D89D] text-[15px] font-semibold text-[#2C3930]"
          >
            <img src={penIcon} alt="" className="h-[18px] w-[18px]" />
            기록 수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#E6E6E6] text-[15px] font-semibold text-[#DC2626]"
          >
            <img src={trashIcon} alt="" className="h-[18px] w-[18px]" />
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
