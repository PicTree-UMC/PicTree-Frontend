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
              장소명을 먼저 보여주고 더보기를 둔다. 사진만으로는 어디였는지 알 수
              없어 매번 열어봐야 했다. 두 줄까지만 보이고 넘치면 말줄임한다 —
              칸 높이가 제각각이면 그리드가 어긋난다.
            */}
            <p className="line-clamp-2 text-[12px] font-semibold leading-[16px] text-[#2C3930]">
              {record.placeName}
            </p>

            <button
              type="button"
              onClick={() => onOpenDetail(record)}
              className="self-start text-[11px] text-[#8D8D8D] underline underline-offset-2"
            >
              더보기
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
