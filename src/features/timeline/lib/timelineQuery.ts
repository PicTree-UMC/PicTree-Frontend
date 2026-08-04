import type { TimelineRecord } from "../types/timeline.types";

/**
 * 정렬 기준. 둘 다 방문 시각(`visitedAt`)을 보고 방향만 반대다.
 *
 * - `recent` 최신순 — 최근에 다녀온 기록이 위로
 * - `oldest` 오래된 순 — 예전에 다녀온 기록이 위로
 */
export const TIMELINE_SORTS = [
  { key: "recent", label: "최신순" },
  { key: "oldest", label: "오래된 순" },
] as const;

export type TimelineSort = (typeof TIMELINE_SORTS)[number]["key"];

/**
 * 정렬이 보는 날짜 = 방문 시각(`recordedAt` = 서버의 `visitedAt`).
 *
 * ⚠️ 예전에는 등록 시각(`createdAt`)을 봤는데 그게 순서가 뒤죽박죽이던 원인이다.
 * 서버는 `visitedAt desc` 로 정렬해 페이지를 잘라 주는데(`timelines.repository`
 * 의 `orderBy: [{ visitedAt: 'desc' }, { id: 'desc' }]`) 프론트가 받아서 다른
 * 기준으로 다시 정렬하니, 한 페이지 안에서만 뒤집힌 목록이 나왔다.
 *
 * 세 날짜의 역할은 이렇다:
 * - `visitedAt` — 사용자가 넣는 방문 시각. 수정 가능하고 화면이 보여줄 값이다.
 * - `createdAt` — 행이 DB 에 꽂힌 시각(`@default(now())`). 서버 기록용.
 * - `updatedAt` — 수정할 때마다 자동 갱신(`@updatedAt`). 정렬에 쓰면 기록을
 *   고칠 때마다 순서가 튄다.
 *
 * 그룹 머리글도 같은 값을 써야 머리글 순서가 어긋나지 않는다.
 *
 * 🔴 **2026-08-04 — `visitedAt` 자체가 사라졌다.** timeline 이 tree 로 합쳐졌는데(#123)
 * `Tree` 에는 방문일이 없다. 지금 `recordedAt` 에는 등록 시각이 들어오거나(상세) 아예
 * 비어 있다(목록). 위 구분은 백엔드가 `visitedAt` 을 다시 줄 때 그대로 살아난다.
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

/** 방문 시각 기준 정렬. 최신순은 내림차순, 오래된 순은 오름차순이다. */
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
