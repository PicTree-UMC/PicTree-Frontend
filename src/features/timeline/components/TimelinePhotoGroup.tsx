import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";

interface Props {
  group: TimelineGroup;
  onOpenDetail: (record: TimelineRecord) => void;
}

/**
 * 장소명 앞에 붙는 위치 핀. 12px 글자 옆에 서므로 획을 굵게(2) 잡았다 —
 * 기본 굵기로는 이 크기에서 흐릿하게 뭉갠다.
 */
function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/**
 * 사진이 없는 기록에 쓸 대체 이미지.
 *
 * ⚠️ `record.defaultImage` 는 여기 쓰면 안 된다. `"DEFAULT_1"` 같은
 * **식별자**(서버 `VarChar(20)`)라 URL 이 아니고, `<img src>` 에 넣으면
 * 그대로 깨진 이미지가 된다 — 사진이 안 뜨던 원인이었다.
 */
const getThumbnail = (record: TimelineRecord) =>
  record.thumbnailUrl ?? "/apple-touch-icon.jpg";

/**
 * 날짜 한 덩어리 — 머리글 + 사진 3열 그리드.
 *
 * 사진(과 그 아래 장소명)을 누르면 상세가 열린다. 시안에는 사진만 있지만
 * 사진만으로는 어디였는지 알 수 없어 장소명을 함께 보여준다.
 */
export function TimelinePhotoGroup({ group, onOpenDetail }: Props) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-bold text-black">{group.label}</h2>

      <ul className="grid grid-cols-3 gap-2.5">
        {group.records.map((record) => (
          <li key={record.id}>
            {/*
              사진과 장소명을 통째로 하나의 버튼으로 묶는다. 사진을 누르면 상세가
              열리므로 "더보기" 텍스트는 두지 않는다 — 장소명도 같은 버튼 안에
              있어야 눌리는 영역이 사진에서 끊기지 않는다.

              썸네일은 시안대로 모서리를 깎지 않고 직각으로 둔다.
            */}
            <button
              type="button"
              onClick={() => onOpenDetail(record)}
              aria-label={`${record.placeName} 자세히 보기`}
              className="flex w-full flex-col gap-1 text-left"
            >
              {/*
                span은 기본적으로 inline이라 w-full/aspect-square가 적용되지 않는다.
                block으로 만들어야 열 너비를 정확히 채우는 정사각형 썸네일이 되고,
                원본 이미지의 고유 너비가 그리드 밖으로 밀려나지 않는다.
              */}
              <span className="block aspect-square w-full overflow-hidden bg-[#EDE7D2]">
                <img
                  src={getThumbnail(record)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </span>

              {/* 칸 폭이 좁아 긴 장소명은 말줄임한다 — 줄이 늘면 그리드가 어긋난다 */}
              <span className="flex h-[18px] min-w-0 items-center gap-1 text-[12px] font-semibold text-[#2C3930]">
                <PinIcon />
                <span className="min-w-0 truncate">{record.placeName}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
