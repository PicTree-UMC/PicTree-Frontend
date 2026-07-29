import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";

interface Props {
  group: TimelineGroup;
  onOpenDetail: (record: TimelineRecord) => void;
}

/** 사진이 없는 기록에 쓸 대체 이미지. 서버가 준 나무 기본 이미지를 먼저 쓴다. */
const getThumbnail = (record: TimelineRecord) =>
  record.thumbnailUrl ?? record.defaultImage ?? "/apple-touch-icon.jpg";

/**
 * 날짜 한 덩어리 — 머리글 + 사진 3열 그리드.
 *
 * 사진 자체를 눌러도, 아래 "더보기" 를 눌러도 상세가 열린다. 시안에는 사진만
 * 있지만 사진만으로는 어디였는지 알 수 없어 진입점을 하나 더 둔 것이다.
 */
export function TimelinePhotoGroup({ group, onOpenDetail }: Props) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-bold text-black">{group.label}</h2>

      <ul className="grid grid-cols-3 gap-2.5">
        {group.records.map((record) => (
          <li key={record.id} className="flex flex-col gap-1">
            {/* 썸네일은 시안대로 모서리를 깎지 않고 직각으로 둔다 */}
            <button
              type="button"
              onClick={() => onOpenDetail(record)}
              aria-label={`${record.placeName} 자세히 보기`}
              className="aspect-square w-full overflow-hidden bg-[#EDE7D2]"
            >
              <img
                src={getThumbnail(record)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>

            {/*
              장소명과 더보기를 한 줄에 좌우로 둔다. 사진만으로는 어디였는지 알 수
              없어 장소명을 먼저 읽히게 하고, 더보기는 오른쪽 끝에 붙인다.

              칸 폭이 좁아 장소명이 길면 더보기를 밀어낸다 — 장소명에 min-w-0 +
              truncate 를 줘서 말줄임되게 하고, 더보기에는 shrink-0 을 줘서
              항상 자기 자리를 지키게 한다.
            */}
            <div className="flex items-baseline gap-1">
              <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#2C3930]">
                {record.placeName}
              </p>
              <button
                type="button"
                onClick={() => onOpenDetail(record)}
                className="shrink-0 text-[11px] text-[#8D8D8D] underline underline-offset-2"
              >
                더보기
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
