import { httpClient } from '@/shared/lib/httpClient';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MapMarkerData } from '../hooks/useMapMarkers';
import type {
  ApiEnvelope,
  CreateTreeData,
  CreateTreeRequest,
  TreeDetail,
  TreeImage,
  TreeImageUploadData,
  TreeListData,
} from '../types/tree';
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

/** 지도는 전체 마커를 한 번에 찍어야 하므로 서버 허용 최대치(100)로 요청한다. */
const MAP_PAGE_SIZE = 100;

/** 지도에 찍을 내 나무 목록 조회. */
export const getTrees = async (): Promise<MapMarkerData[]> => {
  if (!hasToken()) return USE_MOCK_FALLBACK ? DEMO_MARKERS : [];

  try {
    const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees', {
      params: { size: MAP_PAGE_SIZE },
    });
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

/** 장소(나무) 등록. 등록된 treeId 로 이어서 사진을 업로드한다. */
export const createTree = async (
  payload: CreateTreeRequest,
): Promise<CreateTreeData> => {
  const { data } = await httpClient.post<ApiEnvelope<CreateTreeData>>('/trees', payload);
  return data.data;
};

/**
 * 나무 사진 업로드. multipart/form-data 의 단일 파일 필드명은 `image`.
 * timelineRecordId 는 특정 타임라인 기록의 사진일 때만 전달(카메라 등록에서는 생략).
 */
export const uploadTreeImage = async (
  treeId: number,
  image: File,
  timelineRecordId?: number,
): Promise<TreeImage> => {
  const formData = new FormData();
  formData.append('image', image);
  if (timelineRecordId != null) {
    formData.append('timelineRecordId', String(timelineRecordId));
  }

  const { data } = await httpClient.post<ApiEnvelope<TreeImageUploadData>>(
    `/trees/${treeId}/images`,
    formData,
  );
  return data.data.image;
};

/** 즐겨찾기 추가/삭제 토글. */
export const toggleTreeFavorite = async (treeId: number): Promise<void> => {
  await httpClient.patch(`/trees/${treeId}/favorite`);
};

/** 나무 삭제. */
export const deleteTree = async (treeId: number): Promise<void> => {
  await httpClient.delete(`/trees/${treeId}`);
};
