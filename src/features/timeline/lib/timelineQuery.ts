import type { TimelineRecord } from "../types/timeline.types";

/**
 * 정렬 기준.
 *
 * - `recent` 최신순 — 방문 시각(`recordedAt`) 기준
 * - `registered` 등록순 — 서버에 올린 시각(`createdAt`) 기준
 *
 * 지난 여행을 나중에 올릴 수 있어 두 값이 어긋난다. 둘 다 최신이 위로 오고,
 * 무엇을 기준으로 삼느냐만 다르다.
 */
export const TIMELINE_SORTS = [
  { key: "recent", label: "최신순" },
  { key: "registered", label: "등록순" },
] as const;

export type TimelineSort = (typeof TIMELINE_SORTS)[number]["key"];

/** 정렬 기준이 보는 날짜. 그룹 헤더도 같은 값을 써야 머리글 순서가 어긋나지 않는다. */
export const getSortDate = (record: TimelineRecord, sort: TimelineSort): string =>
  sort === "registered" ? record.createdAt ?? record.recordedAt : record.recordedAt;

/**
 * 장소명·한줄평으로 거른다.
 *
 * ⚠️ 서버가 검색을 지원하지 않아(`GET /timelines` 의 쿼리는 `page`·`size` 뿐)
 * 받아온 페이지 안에서만 찾는다. 기록이 한 페이지를 넘어가면 뒤쪽은 걸리지 않으므로,
 * 백엔드에 검색 파라미터가 생기면 이 함수는 서버 호출로 대체해야 한다.
 */
export const searchRecords = (
  records: TimelineRecord[],
  keyword: string,
): TimelineRecord[] => {
  const needle = keyword.trim().toLowerCase();

  if (!needle) {
    return records;
  }

  return records.filter(
    (record) =>
      record.placeName.toLowerCase().includes(needle) ||
      record.comment.toLowerCase().includes(needle),
  );
};

/** 선택한 기준으로 최신이 앞에 오도록 정렬한다. */
export const sortRecords = (
  records: TimelineRecord[],
  sort: TimelineSort,
): TimelineRecord[] =>
  [...records].sort(
    (a, b) =>
      new Date(getSortDate(b, sort)).getTime() -
      new Date(getSortDate(a, sort)).getTime(),
  );
