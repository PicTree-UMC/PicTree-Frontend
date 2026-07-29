import type { TimelineRecord } from "../types/timeline.types";

/**
 * 정렬 기준. 둘 다 등록 시각(`createdAt`)을 보고 방향만 반대다.
 *
 * - `recent` 최신순 — 최근에 올린 기록이 위로
 * - `registered` 등록순 — 처음에 올린 기록이 위로
 *
 * 방문 시각(`recordedAt`)이 아니라 등록 시각을 쓴다. 지난 여행을 나중에 올릴 수
 * 있어 두 값이 어긋나는데, 사용자가 기대하는 "최신" 은 방문한 날이 아니라
 * 목록에 새로 올라온 순서다.
 */
export const TIMELINE_SORTS = [
  { key: "recent", label: "최신순" },
  { key: "registered", label: "등록순" },
] as const;

export type TimelineSort = (typeof TIMELINE_SORTS)[number]["key"];

/**
 * 정렬이 보는 날짜 = 등록 시각. 서버가 안 주면 방문 시각으로 대체한다.
 * 그룹 머리글도 같은 값을 써야 머리글 순서가 어긋나지 않는다.
 */
export const getSortDate = (record: TimelineRecord): string =>
  record.createdAt ?? record.recordedAt;

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

/** 등록 시각 기준 정렬. 최신순은 내림차순, 등록순은 오름차순이다. */
export const sortRecords = (
  records: TimelineRecord[],
  sort: TimelineSort,
): TimelineRecord[] => {
  const direction = sort === "recent" ? -1 : 1;

  return [...records].sort(
    (a, b) =>
      direction *
      (new Date(getSortDate(a)).getTime() - new Date(getSortDate(b)).getTime()),
  );
};
