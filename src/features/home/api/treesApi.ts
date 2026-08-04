import { httpClient } from '@/shared/lib/httpClient';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MapMarkerData } from '../hooks/useMapMarkers';
import type {
  ApiEnvelope,
  CreateTreeData,
  CreateTreeRequest,
  NearbyTreeItem,
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

/**
 * 현재 위치 반경 내 나무 조회. `GET /trees/nearby?lat=&lng=`
 *
 * 가까운 순으로 정렬돼 온다. 근처에 없으면 **빈 배열**이다 — 명세서에는 404
 * `NEARBY_TREE_NOT_FOUND` 가 적혀 있지만 서버는 그 경로로 던지지 않는다.
 *
 * ⚠️ `radius` 는 보내지 않는다. 명세서 URI 에는 `?radius=100` 이 있지만 서버
 * `GetNearbyTreesQueryDto` 는 `lat`·`lng` 만 받고, 반경은 상수
 * `NEARBY_TREE_RADIUS_M = 100` 으로 고정돼 있다. `whitelist: true` 라 보내도
 * 조용히 버려지므로 안 보내는 편이 오해가 없다.
 *
 * ⚠️ 지금은 **다른 사람 나무도 섞여 온다.** 서버 `findNearbyTrees` 쿼리에
 * `userId` 조건이 없다(`WHERE deleted_at IS NULL` 뿐). 백엔드에 수정 요청해
 * 둔 상태이고, 고쳐지면 이 주석과 함께 화면 쪽 처리도 정리한다.
 *
 * 목데이터 폴백은 두지 않는다. 위치 기반 알림은 "없으면 없다"가 정보라서,
 * 실패를 가짜 값으로 덮으면 안 뜨는 이유를 못 찾게 된다.
 */
export const getNearbyTrees = async (
  lat: number,
  lng: number,
): Promise<NearbyTreeItem[]> => {
  const { data } = await httpClient.get<ApiEnvelope<NearbyTreeItem[]>>(
    '/trees/nearby',
    { params: { lat, lng } },
  );
  return data.data ?? [];
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

/**
 * 즐겨찾기 추가/삭제. `PATCH /trees/{treeId}/favorite`
 *
 * 명세서는 본문 `{ isFavorite }` 로 원하는 상태를 지정하게 돼 있다. 서버(develop)는
 * 아직 본문을 읽지 않고 현재 값을 뒤집지만, 명세서대로 실어 보내야 DTO 가 붙었을 때
 * 호출부를 고치지 않아도 된다. 즐겨찾기 화면(`profile/api/favoriteApi`)도 같은 형태로 보낸다.
 */
export const toggleTreeFavorite = async (
  treeId: number,
  isFavorite: boolean,
): Promise<void> => {
  await httpClient.patch(`/trees/${treeId}/favorite`, { isFavorite });
};

/** 나무 삭제. */
export const deleteTree = async (treeId: number): Promise<void> => {
  await httpClient.delete(`/trees/${treeId}`);
};
