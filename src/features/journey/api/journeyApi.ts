import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { Journey, JourneyPhoto } from '../types/journey';
import { formatRecordDate, formatSavedDate } from '../lib/formatDate';

/**
 * 동선 API 레이어.
 *
 * 서버 응답은 공통 래퍼 `{success,code,message,data}` 로 감싸여 오므로 여기서 언랩하고,
 * 화면이 쓰는 형태까지 매핑을 끝낸다 — 위층(훅·페이지)은 서버 필드명을 모른다.
 * 인증 헤더는 httpClient 인터셉터가 붙인다.
 *
 * ⚠️ API 경로는 /routes 지만 코드 용어는 Journey 로 유지한다 (개명은 별도 작업).
 */

/** `GET /routes` 의 item 하나. */
interface RouteListItem {
  routeId: number;
  routeName: string;
  /** 'YYYY-MM-DD' */
  recordDate: string | null;
  placeCount: number;
  places: { name: string; mood?: string }[] | null;
  /** ISO 8601 */
  createdAt: string | null;
}

interface RouteListData {
  items: RouteListItem[] | null;
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/** `GET /routes/{routeId}/images` 의 사진 하나. 사진이 없는 장소는 imageUrl 이 null 이다. */
interface RouteImage {
  treeId: number;
  name: string;
  imageUrl: string | null;
}

const toJourney = (item: RouteListItem): Journey => ({
  id: item.routeId,
  title: item.routeName,
  date: formatRecordDate(item.recordDate),
  savedAt: formatSavedDate(item.createdAt),
  placeCount: item.placeCount,
  places: item.places ?? [],
});

/**
 * 저장된 동선 목록 조회. `GET /routes`
 *
 * 응답에 page/size/total 이 있지만 요청 파라미터는 스웨거에 정의돼 있지 않다.
 * 지금은 첫 페이지만 쓰고, 목록이 길어지면 그때 백엔드에 파라미터를 확인한다.
 */
export const getJourneys = async (): Promise<Journey[]> => {
  const { data } = await httpClient.get<ApiResponse<RouteListData>>('/routes');

  return (data.data?.items ?? []).map(toJourney);
};

/** 동선 1건 삭제. `DELETE /routes/{routeId}` (노드도 함께 삭제된다) */
export const deleteJourney = async (id: number): Promise<void> => {
  await httpClient.delete(`/routes/${id}`);
};

/** 동선 이름 변경. `PATCH /routes/{routeId}` */
export const renameJourney = async (id: number, title: string): Promise<void> => {
  await httpClient.patch(`/routes/${id}`, { routeName: title });
};

/**
 * 동선 사진 앨범 조회. `GET /routes/{routeId}/images`
 *
 * 동선에 속한 장소들의 대표 사진을 방문 순서로 준다. 장소당 한 칸이므로
 * 사진이 없는 장소도 자리를 차지한다(url=null → 앱 아이콘).
 */
export const getJourneyPhotos = async (id: number): Promise<JourneyPhoto[]> => {
  const { data } = await httpClient.get<ApiResponse<{ images: RouteImage[] | null }>>(
    `/routes/${id}/images`,
  );

  return (data.data?.images ?? []).map((image) => ({
    treeId: image.treeId,
    placeName: image.name,
    url: image.imageUrl,
  }));
};
