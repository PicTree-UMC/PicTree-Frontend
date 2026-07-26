import { httpClient } from '@/shared/lib/httpClient';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MapMarkerData } from '../hooks/useMapMarkers';
import type { ApiEnvelope, TreeDetail, TreeListData } from '../types/tree';
import { detailToMarker, listItemToMarker } from '../lib/treeMapping';
import { DEMO_MARKERS } from '../mocks/markers';

/**
 * 나무(지도) API 레이어.
 *
 * 개발 환경(import.meta.env.DEV)에서는 로그인/백엔드가 없어도 화면이 비지 않도록
 * 토큰이 없거나 API 호출이 실패하면 목데이터로 폴백한다.
 * 프로덕션(배포)에서는 폴백 없이 실 API 만 사용하고 에러는 그대로 노출한다.
 */
const hasToken = () => Boolean(useAuthStore.getState().accessToken);
const USE_MOCK_FALLBACK = import.meta.env.DEV;

/** 지도에 찍을 내 나무 목록 조회. */
export const getTrees = async (): Promise<MapMarkerData[]> => {
  if (!hasToken()) return USE_MOCK_FALLBACK ? DEMO_MARKERS : [];

  try {
    const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees');
    return data.data.items.map(listItemToMarker);
  } catch (error) {
    if (USE_MOCK_FALLBACK) return DEMO_MARKERS;
    throw error;
  }
};

/** 나무 상세 조회(마커 탭 시 코멘트·사진·날짜 채우기용). */
export const getTreeDetail = async (treeId: number): Promise<MapMarkerData> => {
  const { data } = await httpClient.get<ApiEnvelope<TreeDetail>>(`/trees/${treeId}`);
  return detailToMarker(data.data);
};

/** 즐겨찾기 추가/삭제 토글. */
export const toggleTreeFavorite = async (treeId: number): Promise<void> => {
  await httpClient.patch(`/trees/${treeId}/favorite`);
};

/** 나무 삭제. */
export const deleteTree = async (treeId: number): Promise<void> => {
  await httpClient.delete(`/trees/${treeId}`);
};
