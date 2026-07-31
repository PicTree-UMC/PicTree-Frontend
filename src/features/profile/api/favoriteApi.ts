import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type { FavoriteList, ToggledFavorite } from '../types/favorite';

/**
 * 즐겨찾기 장소 목록·개수 조회. `GET /trees/favorites`
 *
 * 응답에 개수(`count`)가 따로 온다 — 목록 길이와 같지만 서버가 준 값을 그대로 쓴다.
 * 좌표·기분은 없고 방문일과 대표 이미지가 오는, 지도 목록과 다른 형태다.
 */
export async function getFavorites(): Promise<FavoriteList> {
  const { data } = await httpClient.get<ApiResponse<FavoriteList>>('/trees/favorites');

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}

/**
 * 즐겨찾기 추가/삭제. `PATCH /trees/{treeId}/favorite`
 *
 * ⚠️ 명세서와 서버 구현이 다르다.
 *   - 명세서: 본문 `{ isFavorite }` 로 원하는 상태를 **지정**한다
 *   - 서버(develop): 본문을 읽지 않고 `!tree.isFavorite` 로 **뒤집는다** (순수 토글)
 *
 * 명세서대로 본문을 실어 보낸다. 지금 서버는 무시하지만, 나중에 DTO 가 붙어도
 * 호출부를 고칠 필요가 없다. 대신 요청한 값을 믿지 않고 **응답의 `isFavorite` 을
 * 실제 상태로 쓴다** — 서버가 토글이면 요청값과 결과가 어긋날 수 있다.
 *
 * 서버가 토글인 동안은 현재 상태를 아는 곳에서만 불러야 한다. 이미 담긴 장소를
 * 다시 "추가" 하면 토글이라 오히려 빠진다.
 *
 * 실패 코드: 403 `TREE403`(타인의 나무), 404 `TREE404`(없는 나무).
 */
export async function setFavorite(
  treeId: number,
  isFavorite: boolean,
): Promise<ToggledFavorite> {
  const { data } = await httpClient.patch<ApiResponse<ToggledFavorite>>(
    `/trees/${treeId}/favorite`,
    { isFavorite },
  );

  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}
