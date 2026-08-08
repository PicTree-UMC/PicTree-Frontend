/**
 * `GET /trees/favorites` 의 개별 항목. 서버 `FavoriteTreeResponseDto` 와 같다.
 *
 * 지도의 `TreeListItem` 과는 다른 형태다 — 좌표·기분이 없고 대신 방문일과
 * 대표 이미지가 온다. 즐겨찾기 목록에만 쓰이므로 profile 쪽에 따로 둔다.
 */
export type FavoritePlace = {
  treeId: number;
  name: string;
  /** 한 줄 코멘트. 없을 수 있다. */
  description: string | null;
  /**
   * 장소를 기록한 날 (`2026-03-30` 형태). 서버 필드명이 `createdAt` 이다 —
   * 다른 화면의 `visitedAt` 과 이름이 다르니 맞춰 쓰지 말 것.
   */
  createdAt: string;
  imageUrl: string | null;
};

/** `GET /trees/favorites` 응답의 `data`. */
export type FavoriteList = {
  /** 서버가 세어 준 개수. 목록 길이와 같지만 응답에 명시돼 있어 그대로 쓴다. */
  count: number;
  favorites: FavoritePlace[];
};

/** `PATCH /trees/{treeId}/favorite` 응답의 `data`. */
export type ToggledFavorite = {
  treeId: number;
  isFavorite: boolean;
};

/**
 * 여러 곳을 한 번에 해제한 결과. 일괄 엔드포인트가 없어 건별로 부르므로
 * 일부만 성공할 수 있다 — 화면 문구가 실제 건수를 말하려면 둘 다 필요하다.
 */
export type BulkFavoriteResult = {
  removedIds: number[];
  failedCount: number;
};
