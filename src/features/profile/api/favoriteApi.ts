import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/features/auth/types/auth';
import type { FavoriteList, ToggledFavorite } from '../types/favorite';
import { DEMO_FAVORITES } from '../mocks/favorites';

/**
 * 개발 환경에서만 목데이터로 폴백한다 (지도 `treesApi`·타임라인과 같은 방식).
 * 배포 빌드에서는 폴백 없이 실 API 만 쓰고 에러도 그대로 노출한다.
 */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

/**
 * 즐겨찾기 장소 목록·개수 조회. `GET /trees/favorites`
 *
 * 응답에 개수(`count`)가 따로 온다 — 목록 길이와 같지만 서버가 준 값을 그대로 쓴다.
 * 좌표·기분은 없고 방문일과 대표 이미지가 오는, 지도 목록과 다른 형태다.
 */
export async function getFavorites(): Promise<FavoriteList> {
  try {
    const { data } = await httpClient.get<ApiResponse<FavoriteList>>('/trees/favorites');

    // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
    if (data.resultType === 'FAIL') {
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      return DEMO_FAVORITES;
    }

    throw error;
  }
}

/**
 * 즐겨찾기 추가/삭제 토글. `PATCH /trees/{treeId}/favorite`
 *
 * ⚠️ 해제 전용이 아니라 토글이다. 즐겨찾기 화면에서는 이미 담긴 장소만 다루므로
 * 결과적으로 "제거" 로 쓰이지만, 같은 나무에 두 번 부르면 다시 담긴다.
 * 응답의 `isFavorite` 로 실제 상태를 확인할 수 있다.
 */
export async function toggleFavorite(treeId: number): Promise<ToggledFavorite> {
  const { data } = await httpClient.patch<ApiResponse<ToggledFavorite>>(
    `/trees/${treeId}/favorite`,
  );

  if (data.resultType === 'FAIL') {
    throw new Error(data.error.message);
  }

  return data.data;
}
