import { IconFrame, PhotoPost, PostHeartIcon } from "@/shared/components";

import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";

interface Props {
  group: TimelineGroup;
  /** 하트를 눌러 즐겨찾기를 토글한다. */
  onToggleFavorite: (record: TimelineRecord) => void;
  /** 머리글의 수정 아이콘. 상세 없이 바로 수정 모달로 간다. */
  onEdit: (record: TimelineRecord) => void;
  /** 머리글의 삭제 아이콘. */
  onDelete: (record: TimelineRecord) => void;
}

/** 수정(연필) 아이콘. */
function PencilIcon() {
  return (
    <IconFrame box={{ cx: 13.8, cy: 10.4, h: 15.2 }} aria-hidden>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M19.5 7.125L16.875 4.5" />
    </IconFrame>
  );
}

/** 삭제(휴지통) 아이콘. */
function TrashIcon() {
  return (
    <IconFrame box={{ cx: 12, cy: 13, h: 18 }} aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3" />
    </IconFrame>
  );
}

/**
 * 날짜 한 덩어리를 게시물로 — 인스타 피드처럼 한 칸씩 크게 본다.
 *
 * 얼개(아바타 + 장소명 / 날짜 · 사진 · 액션 줄 · 한줄평)는 공용 `PhotoPost` 가
 * 그리고, 여기서는 이 화면의 액션(즐겨찾기 하트 · 수정 · 삭제)만 채운다.
 * 같은 얼개를 즐겨찾기 장소 화면도 쓴다.
 *
 * ⚠️ **격자로 보는 모드는 즐겨찾기 장소로 옮겼다.** 타임라인은 게시물로 읽는
 * 화면에 집중하고, 사진을 격자로 훑는 건 즐겨찾기가 맡는다. 그래서 사진을 눌러
 * 여는 상세 시트도 함께 없앴다 — 수정·삭제·즐겨찾기가 이미 이 줄에 다 있다.
 *
 * 날짜 머리글은 게시물마다 날짜가 있어서 두지 않는다.
 *
 * 사진이 없거나 못 불러온 기록은 `PhotoPost` 안의 `Photo` 가 나무 폴백으로 받는다.
 * 예전엔 여기서 앱 아이콘(`/apple-touch-icon.jpg`)을 넘겨 **픽트리 로고가 4:5 게시물로
 * 깔렸다** — 기록이 아니라 광고처럼 보였다(#209).
 */
export function TimelinePhotoGroup({
  group,
  onToggleFavorite,
  onEdit,
  onDelete,
}: Props) {
  return (
    <ul className="flex flex-col gap-5">
      {group.records.map((record) => (
        <li key={record.id}>
          <PhotoPost
            title={record.placeName}
            meta={group.label}
            imageUrl={record.thumbnailUrl}
            caption={record.comment}
            actions={
              <>
                {record.treeId != null && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(record)}
                    aria-label="즐겨찾기"
                    aria-pressed={!!record.isFavorite}
                    className="-ml-1 p-1 transition active:scale-90"
                  >
                    <PostHeartIcon filled={!!record.isFavorite} />
                  </button>
                )}

                <div className="ml-auto flex items-center">
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    aria-label="수정"
                    className="p-1 transition active:scale-90"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(record)}
                    aria-label="삭제"
                    className="-mr-1 p-1 transition active:scale-90"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </>
            }
          />
        </li>
      ))}
    </ul>
  );
}
