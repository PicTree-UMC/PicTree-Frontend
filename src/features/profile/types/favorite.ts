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
  /** 방문일 (`2026-03-30` 형태의 날짜 문자열) */
  visitedAt: string;
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
