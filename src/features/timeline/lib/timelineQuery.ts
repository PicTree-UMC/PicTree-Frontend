import type { TimelineRecord } from "../types/timeline.types";

/**
 * 정렬 기준. 둘 다 방문 시각(`visitedAt`)을 보고 방향만 반대다.
 *
 * - `recent` 최신순 — 최근에 다녀온 기록이 위로
 * - `oldest` 등록순 — 먼저 기록한 것이 위로
 */
export const TIMELINE_SORTS = [
  { key: "recent", label: "최신순" },
  { key: "oldest", label: "등록순" },
] as const;

export type TimelineSort = (typeof TIMELINE_SORTS)[number]["key"];

/**
 * 정렬이 보는 날짜 = `recordedAt`.
 *
 * **2026-08-04 — 방문일과 등록일을 같은 것으로 본다(#123).** timeline 이 tree 로 합쳐지며
 * `visitedAt` 이 사라졌고, `Tree.createdAt`(등록 시각)을 방문일로 쓰기로 했다.
 * 촬영이 곧 등록이라 두 값이 실제로 같은 순간이다 — **지난 여행을 나중에 올리는 경로가
 * 앱에 없기 때문에** 성립하는 전제다. 그 기능이 생기면 여기부터 깨진다.
 *
 * `updatedAt` 은 여전히 정렬에 쓰지 않는다 — 기록을 고칠 때마다 순서가 튄다.
 * 그룹 머리글도 같은 값을 써야 머리글 순서가 어긋나지 않는다.
 */
export const getSortDate = (record: TimelineRecord): string =>
  record.recordedAt;

/**
 * 장소명·한줄평으로 거른다.
 *
 * ⚠️ 서버가 검색을 지원하지 않아(`GET /trees` 의 쿼리는 `page`·`size` 뿐)
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

/** 기록 시각 기준 정렬. 최신순은 내림차순, 등록순은 오름차순이다. */
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
