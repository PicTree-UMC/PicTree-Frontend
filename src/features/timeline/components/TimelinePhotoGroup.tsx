import { useState } from "react";

import {
  FavoriteHeartButton,
  IconFrame,
  PhotoPost,
  TRASH_BOX,
  TRASH_GLYPH,
} from "@/shared/components";
import type { PhotoPostSlide } from "@/shared/components";

import type { TimelineSort } from "../lib/timelineQuery";
import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";

interface Props {
  group: TimelineGroup;
  /**
   * 지금 목록이 어떤 순서로 서 있는지. 그리는 데는 안 쓰고 **바뀌었는지만** 본다 —
   * 정렬이 바뀌면 보던 장을 첫 장으로 되돌린다(아래 참고).
   */
  sort: TimelineSort;
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
    <IconFrame box={{ cx: 13.8, cy: 10.4, w: 15.8, h: 15.2 }} aria-hidden>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M19.5 7.125L16.875 4.5" />
    </IconFrame>
  );
}

/** 삭제(휴지통) 아이콘. 글리프는 공용 lucide `trash` 하나를 쓴다. */
function TrashIcon() {
  return (
    <IconFrame box={TRASH_BOX} aria-hidden>
      <path d={TRASH_GLYPH} />
    </IconFrame>
  );
}

/**
 * 날짜 한 덩어리를 게시물 **한 칸**으로 — 같은 날 찍은 기록은 옆으로 넘겨 본다.
 *
 * 예전에는 이 그룹이 기록 수만큼 게시물을 세로로 펼쳤다. 하루에 여러 장을 찍으면
 * 같은 날짜가 화면 몇 개 분량으로 이어져, 다음 날을 보려면 그만큼 계속 내려야 했다.
 * 지금은 하루가 한 칸이고, 그 안을 가로로 넘긴다 — 세로 스크롤은 날짜를 넘기는
 * 뜻만 갖는다.
 *
 * ⚠️ **여기서 넘기는 한 장 한 장은 인스타처럼 '한 게시물의 사진 여러 장' 이 아니라
 * 서로 다른 기록이다.** 그래서 사진만 바뀌는 게 아니라 머리글의 장소명·한줄평·
 * 액션 대상까지 같이 따라간다. 그룹 전체가 같은 값인 것은 날짜(머리글 오른쪽)뿐이다.
 *
 * 얼개(아바타 + 장소명 / 날짜 · 사진 · 액션 줄 · 한줄평)와 넘기는 동작·점·`n/N`
 * 알약은 공용 `PhotoPost` 가 그리고, 여기서는 이 화면의 액션(즐겨찾기 하트 · 수정 ·
 * 삭제)과 지금 보고 있는 장을 채운다. 같은 얼개를 즐겨찾기 장소 화면도 쓴다
 * (거기는 사진이 한 장이라 넘기는 자리가 안 생긴다).
 *
 * 기록이 하나뿐인 날은 점도 알약도 안 붙어, 예전과 똑같은 게시물 한 칸으로 보인다.
 *
 * 사진이 없거나 못 불러온 기록은 `PhotoPost` 안의 `Photo` 가 나무 폴백으로 받는다.
 * 예전엔 여기서 앱 아이콘(`/apple-touch-icon.jpg`)을 넘겨 **픽트리 로고가 4:5 게시물로
 * 깔렸다** — 기록이 아니라 광고처럼 보였다(#209).
 */
export function TimelinePhotoGroup({
  group,
  sort,
  onToggleFavorite,
  onEdit,
  onDelete,
}: Props) {
  const [index, setIndex] = useState(0);

  /*
   * 정렬이 바뀌면 **그룹 안쪽 순서도 함께 뒤집힌다**(`sortRecords` 가 그룹으로 묶기
   * 전에 전체를 줄 세운다). 보던 장 번호를 그대로 두면 같은 3번 자리에 전혀 다른
   * 기록이 앉아, 사진·장소명·한줄평이 통째로 갈린다 — 정렬한 게 아니라 화면이
   * 망가진 것처럼 읽힌다. 첫 장으로 되돌려 새 순서를 처음부터 보여준다.
   *
   * ⚠️ **`key` 에 정렬을 섞어 remount 시키지 않는다.** 그러면 사진(`img`)이 전부
   * 새로 붙어 캐시가 없는 장에서 빈 칸이 한 번 스친다. 되돌릴 것은 장 번호 하나뿐이다.
   *
   * ⚠️ **`useEffect` 가 아니라 렌더 중에 맞춘다.** effect 는 그린 뒤에 도는지라
   * 옛 번호로 한 프레임이 먼저 그려졌다 튄다. 여기서 `setIndex` 를 부르면 React 가
   * 화면에 내보내기 전에 다시 렌더한다(props 변화에 state 를 맞추는 표준 패턴).
   *
   * 가로 스크롤 위치는 `PhotoStrip` 이 `activeIndex` 를 보고 따라온다.
   */
  const [shownSort, setShownSort] = useState(sort);
  if (shownSort !== sort) {
    setShownSort(sort);
    setIndex(0);
  }

  const records = group.records;
  if (records.length === 0) return null;

  /*
   * 보고 있던 장이 지워지면(그 기록만 삭제) 목록이 짧아진다. state 를 그대로 쓰면
   * 범위 밖을 가리켜 `record` 가 undefined 가 되므로, 그릴 때마다 끝으로 당긴다.
   * state 자체를 되돌리지 않는 건 되돌릴 필요가 없어서다 — 다음 렌더도 같은 계산을 한다.
   */
  const activeIndex = Math.min(index, records.length - 1);
  const record = records[activeIndex];

  const slides: PhotoPostSlide[] = records.map((r) => ({
    key: r.id,
    url: r.thumbnailUrl,
    alt: r.placeName,
  }));

  return (
    <PhotoPost
      title={record.placeName}
      meta={group.label}
      photos={slides}
      activeIndex={activeIndex}
      onActiveIndexChange={setIndex}
      caption={record.comment}
      actions={
        <>
          {record.treeId != null && (
            <FavoriteHeartButton
              filled={!!record.isFavorite}
              onToggle={() => onToggleFavorite(record)}
              label="즐겨찾기"
              className="-ml-1"
            />
          )}

          {/*
            gap-3: 삭제는 되돌릴 수 없어서 수정 옆에 바짝 붙이지 않는다. 예전엔 갭이
            아예 없어 글리프 사이가 8px 이었다 — 스토리 뷰어(12px)와도 어긋나 있었다.
          */}
          <div className="ml-auto flex items-center gap-3">
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
  );
}
