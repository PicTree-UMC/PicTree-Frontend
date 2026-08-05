import type { SVGProps } from "react";

import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";

interface Props {
  group: TimelineGroup;
  /** 그리드(돋보기 탭처럼 격자) 또는 피드(게시물처럼 한 칸씩 크게). */
  view: "grid" | "feed";
  onOpenDetail: (record: TimelineRecord) => void;
  /** 피드에서 하트를 눌러 즐겨찾기를 토글한다. */
  onToggleFavorite: (record: TimelineRecord) => void;
  /** 피드 머리글의 수정 아이콘. 상세 없이 바로 수정 모달로 간다. */
  onEdit: (record: TimelineRecord) => void;
  /** 피드 머리글의 삭제 아이콘. */
  onDelete: (record: TimelineRecord) => void;
}

/** 세 아이콘의 글리프를 맞출 세로 길이(24 좌표계 기준). */
const GLYPH_HEIGHT = 16;
/** 맞춘 뒤 보이길 바라는 선 굵기. 배율로 나눠 되돌리므로 셋 다 같아 보인다. */
const GLYPH_STROKE = 1.7;

interface GlyphBox {
  /** 그려진 부분의 가로 중심. */
  cx: number;
  /** 그려진 부분의 세로 중심. */
  cy: number;
  /** 그려진 부분의 세로 길이. */
  h: number;
}

/**
 * 하트·연필·휴지통을 같은 높이로 세워 주는 껍데기.
 *
 * 셋은 같은 24×24 박스를 쓰지만 **실제로 그려진 범위가 제각각**이다 — 연필은
 * 위로 붙어 있고(y 2.8~18) 휴지통은 아래로 길다(y 4~22). 그래서 같은 h-7 로
 * 나란히 놓아도 높이도 중심도 어긋나 보였다.
 *
 * 각 글리프의 경계 상자를 받아 박스 한가운데로 옮기고 세로 길이를
 * `GLYPH_HEIGHT` 로 맞춘다. 배율이 선 굵기까지 함께 늘리므로 굵기는 배율만큼
 * 나눠 되돌린다.
 */
function IconFrame({
  box,
  children,
  ...svgProps
}: { box: GlyphBox } & SVGProps<SVGSVGElement>) {
  const scale = GLYPH_HEIGHT / box.h;

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={GLYPH_STROKE / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svgProps}
    >
      <g transform={`translate(12 12) scale(${scale}) translate(${-box.cx} ${-box.cy})`}>
        {children}
      </g>
    </svg>
  );
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

/** 프로필 아이콘 느낌으로 장소명 앞에 두는 나무 아바타(지도 마커와 같은 에셋). */
const TREE_AVATAR = "/markers/tree.svg";

/** 즐겨찾기 하트. 켜지면 분홍으로 채우고, 꺼지면 외곽선만. */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <IconFrame
      box={{ cx: 12, cy: 12, h: 16.5 }}
      fill={filled ? "#ff4d6d" : "none"}
      stroke={filled ? "#ff4d6d" : "currentColor"}
      aria-hidden
    >
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </IconFrame>
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

type GridBodyProps = Pick<Props, "group" | "onOpenDetail">;

/**
 * 날짜 한 덩어리를 그리드로 — 인스타 돋보기 탭처럼 썸네일 간 갭을 최소로(2px)
 * 좁히고 세로(3:4) 비율로 둔다. 사진을 누르면 상세가 열린다.
 */
function GridBody({ group, onOpenDetail }: GridBodyProps) {
  return (
    <section>
      {/* 날짜를 못 받은 그룹은 머리글이 비어 있다 — 빈 h2 를 두면 여백만 남는다(#123). */}
      {group.label && (
        <h2 className="mb-2 px-5 text-[18px] text-[#60655C]">{group.label}</h2>
      )}
      <ul className="grid grid-cols-3 gap-0.5">
        {group.records.map((record) => (
          <li key={record.id}>
            {/*
              썸네일 하나가 곧 버튼이다. 장소명 캡션은 시안대로 빼고 사진만 남긴다.
              span은 inline이라 aspect가 안 먹으므로 block으로 만들어 열 너비를 채운다.
            */}
            <button
              type="button"
              onClick={() => onOpenDetail(record)}
              aria-label={`${record.placeName} 자세히 보기`}
              className="block aspect-[3/4] w-full overflow-hidden bg-[#EDE7D2]"
            >
              <img
                src={getThumbnail(record)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type FeedBodyProps = Pick<
  Props,
  "group" | "onToggleFavorite" | "onEdit" | "onDelete"
>;

/**
 * 날짜 한 덩어리를 피드로 — 인스타 피드 게시물처럼 한 칸씩 크게 본다.
 *
 * 사진 위 머리글은 인스타 게시물처럼 좌측에 프로필(나무 아바타)+장소명, 우측에 날짜.
 * 사진 아래엔 즐겨찾기 하트와 수정·삭제, 그 아래 한줄평을 둔다.
 * 그리드에 있던 날짜 머리글은 게시물마다 날짜가 있으므로 여기서 접는다.
 *
 * 게시물 모드에는 상세 화면이 없다 — 사진 자체는 눌러도 아무 동작이 없고,
 * 즐겨찾기 하트·머리글 아이콘만 반응한다.
 */
function FeedBody({ group, onToggleFavorite, onEdit, onDelete }: FeedBodyProps) {
  return (
    <ul className="flex flex-col gap-5">
      {group.records.map((record) => (
        <li key={record.id}>
          <article>
            {/* 머리글: 좌측 나무 아바타 + 장소명 / 우측 날짜 */}
            <div className="flex items-center gap-2 px-3 pb-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EDE7D2]">
                <img src={TREE_AVATAR} alt="" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] text-[#2C3930]">
                {record.placeName}
              </span>
              <span className="shrink-0 text-[15px] text-[#60655C]">{group.label}</span>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EDE7D2]">
              <img
                src={getThumbnail(record)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            {/*
              사진 아래 한 줄에 클릭 요소를 모은다: 즐겨찾기 · 수정 · 삭제.

              세 칸짜리 그리드로 두고 각자 자기 칸의 시작/가운데/끝에 붙인다.
              flex + ml-auto 로 밀면 하트가 없는 기록(나무 없는 기록)에서 수정이
              가운데를 벗어난다 — 칸을 고정해야 어느 기록에서든 같은 자리에 선다.
            */}
            <div className="px-3 pt-2">
              <div className="grid grid-cols-3 items-center text-[#2C3930]">
                {record.treeId != null && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(record)}
                    aria-label="즐겨찾기"
                    aria-pressed={!!record.isFavorite}
                    className="col-start-1 -ml-1 justify-self-start p-1 transition active:scale-90"
                  >
                    <HeartIcon filled={!!record.isFavorite} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  aria-label="수정"
                  className="col-start-2 justify-self-center p-1 transition active:scale-90"
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(record)}
                  aria-label="삭제"
                  className="col-start-3 -mr-1 justify-self-end p-1 transition active:scale-90"
                >
                  <TrashIcon />
                </button>
              </div>

              {/* 한줄평이 있을 때만 캡션을 단다. font-light 로 medium 느낌을 뺀다. */}
              {record.comment && (
                <p className="pt-1 text-[15px] font-light leading-[22px] text-[#2C3930]">
                  {record.comment}
                </p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** 날짜 한 덩어리 — 그리드/피드 뷰를 갈아 끼운다. */
export function TimelinePhotoGroup({
  group,
  view,
  onOpenDetail,
  onToggleFavorite,
  onEdit,
  onDelete,
}: Props) {
  if (view === "feed") {
    return (
      <FeedBody
        group={group}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return <GridBody group={group} onOpenDetail={onOpenDetail} />;
}
