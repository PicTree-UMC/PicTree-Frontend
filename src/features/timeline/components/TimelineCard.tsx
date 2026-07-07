import { useState } from "react";
import type { TimelineRecord } from "../types/timeline.types";

// ISO 시각 문자열 → "09:30"
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

/**
 * 구조: [좌: 썸네일+시간] [중: 장소명+코멘트] [우: '기록됨' 배지 + 사진 라벨]
 *       + 하단 삭제 버튼(누르면 인라인 확인 줄로 전환)
 * 디자인 미확정: 색상/보더/라운드/여백은 확정 후 className 에 반영.
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
    // TODO(디자인): 카드 보더/배경/라운드/그림자/여백
    <li>
      {/* 카드 본문: 좌·중·우 3분할 (flex 는 구조라 유지) */}
      <div className="flex">
        {/* 좌: 썸네일 + 시간 */}
        <div>
          {hasPhoto ? (
            // TODO(디자인): 썸네일 크기/모양(원형 등)
            <img src={record.thumbnailUrl as string} alt={record.placeName} />
          ) : (
            // TODO(디자인): 사진 없는 기록 플레이스홀더(아이콘 등)
            <span aria-hidden />
          )}
          {/* TODO(디자인): 시간 타이포/색상 */}
          <span>{formatTime(record.recordedAt)}</span>
        </div>

        {/* 중: 장소명 + 코멘트 */}
        <div className="flex-1">
          {/* TODO(디자인): 장소명 강조 타이포 */}
          <p>{record.placeName}</p>
          {/* TODO(디자인): 코멘트 보조 타이포/색상 */}
          <p>{record.comment}</p>
        </div>

        {/* 우: 기록됨 배지 + 사진 라벨 */}
        <div>
          {/* TODO(디자인): '기록됨' 배지 스타일 */}
          <span>기록됨</span>
          {/* TODO(디자인): 사진 라벨/썸네일 스타일 */}
          {hasPhoto && <span>사진</span>}
        </div>
      </div>

      {/* 하단 삭제 영역: confirming 에 따라 [확인 줄] 또는 [삭제 버튼] */}
      {confirming ? (
        // TODO(디자인): 삭제 확인 줄 배경/버튼 색(취소=중립, 삭제=위험)
        <div>
          <span>이 기록을 삭제할까요?</span>
          <button type="button" onClick={() => setConfirming(false)}>
            취소
          </button>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            disabled={isDeleting}
          >
            삭제
          </button>
        </div>
      ) : (
        // TODO(디자인): 삭제 버튼 스타일/아이콘
        <button type="button" onClick={() => setConfirming(true)}>
          삭제
        </button>
      )}
    </li>
  );
}