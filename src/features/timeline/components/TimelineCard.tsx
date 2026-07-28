import type { TimelineRecord } from "../types/timeline.types";
import ellipsisIcon from "../assets/ellipsis.svg";

// ISO → "09:30"
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

interface Props {
  record: TimelineRecord;
  onOpenMenu: (record: TimelineRecord) => void;
}

export default function TimelineCard({ record, onOpenMenu }: Props) {
  return (
    <li className="flex items-start justify-between rounded-[12px] border-2 border-[#C5D89D] bg-white px-[13px] py-3">
      <div className="flex min-w-0 gap-4">
        <div className="h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-[20px] bg-[rgba(197,216,157,0.8)]">
          {/*
            사진 없는 기록은 앱 아이콘으로 대체한다. 빈 칸으로 두면 카드가 비어 보이고,
            사진 있는 기록과 크기·모서리가 어긋난다.
            아이콘 이미지 자체에 둥근 모서리가 그려져 있어 그대로 넣으면 모서리에 흰 여백이
            비친다 — scale 로 살짝 키워 잘라내고, 모서리는 컨테이너가 만든다.
          */}
          <img
            src={record.thumbnailUrl ?? "/apple-touch-icon.jpg"}
            alt=""
            className={`h-full w-full object-cover ${
              record.thumbnailUrl ? "" : "scale-[1.12]"
            }`}
          />
        </div>
        <div className="flex min-w-0 flex-col pt-0.5">
          <p className="truncate text-base font-bold leading-5 text-[#2C3930]">
            {record.placeName}
          </p>
          <p className="truncate text-xs font-medium leading-5 text-[#8D8D8D]">
            {record.comment}
          </p>
          <p className="text-xs font-medium leading-5 text-[#2C3930]">
            {formatTime(record.recordedAt)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpenMenu(record)}
        aria-label="더보기"
        className="flex-shrink-0 pl-1"
      >
        <img src={ellipsisIcon} alt="" className="h-6 w-6" />
      </button>
    </li>
  );
}
