import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { Journey, JourneyPhoto } from '../types/journey';
import type { RouteDetail, RoutePlace } from '../types/route';
import { formatRecordDates, formatSavedDate } from '../lib/formatDate';

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
  /**
   * 방문 날짜들. 'YYYY-MM-DD' 배열이다.
   *
   * ⚠️ 예전엔 `recordDate` 단수였다 — 한 동선이 여러 날짜를 걸칠 수 있다는 이유로 서버가
   * 배열로 바꿨고(2026-07-31), 알려주지 않아 카드 날짜가 조용히 빈칸으로 나왔다.
   * 스웨거는 주기적으로 다시 뽑아 `diff` 할 것.
   */
  recordDates: string[] | null;
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
  date: formatRecordDates(item.recordDates),
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

/** `GET /routes/{routeId}` 의 노드 하나. 목록과 달리 좌표·날짜·순서까지 온다. */
interface RouteDetailPoint {
  treeId: number;
  name: string;
  /** 기분 이모지('😍'). 나무 조회 예시의 'HAPPY' 는 낡은 예시고 실제 값은 이모지다. */
  mood?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  /** 'YYYY-MM-DD' 방문 날짜. 노드마다 달릴 수 있다. */
  date: string;
  /** 방문 순서. 0부터. */
  sequence: number;
}

interface RouteDetailData {
  routeId: number;
  routeName: string;
  createdAt: string | null;
  points: RouteDetailPoint[] | null;
}

/**
 * 저장된 동선 상세 조회. `GET /routes/{routeId}`
 *
 * **이 한 번으로 지도에 그릴 게 다 온다** — 좌표·이름·기분·설명·날짜·순서. 목록에서 날짜를
 * 넘겨줄 필요가 없어서 딥링크(새로고침)로 들어와도 화면이 완성된다.
 */
export const getRouteDetail = async (routeId: number): Promise<RouteDetail> => {
  const { data } = await httpClient.get<ApiResponse<RouteDetailData>>(`/routes/${routeId}`);
  const detail = data.data;

  // 순서는 서버 배열 순서를 믿지 않고 sequence 로 정한다 — 이 순서가 곧 지도의 선과 번호다.
  const points = [...(detail?.points ?? [])].sort((a, b) => a.sequence - b.sequence);

  return {
    id: detail?.routeId ?? routeId,
    name: detail?.routeName ?? '',
    savedAt: formatSavedDate(detail?.createdAt),
    places: points.map(
      (point, index): RoutePlace => ({
        // 같은 나무를 다시 방문하면 treeId 가 겹친다 → 화면용 키는 방문 순서로 만든다.
        id: index,
        treeId: point.treeId,
        name: point.name,
        lat: point.latitude,
        lng: point.longitude,
        date: point.date,
        mood: point.mood ?? undefined,
        description: point.description ?? undefined,
      }),
    ),
  };
};

/**
 * 동선 저장. `POST /routes`
 *
 * **본문은 이름과 `{treeId, sequence}` 뿐이다** — 좌표도 날짜도 안 받는다. 서버가 나무에서
 * 끌어다 채우므로 화면이 들고 있는 장소는 반드시 **실제 나무**여야 한다(목 좌표로는 못 만든다).
 * `sequence` 는 0부터, 배열 순서가 곧 방문 순서다.
 *
 * 응답으로 `routeId` 만 오므로 저장된 내용은 목록/상세를 다시 받아야 보인다.
 */
export const createRoute = async (routeName: string, treeIds: number[]): Promise<number> => {
  const { data } = await httpClient.post<ApiResponse<{ routeId: number }>>('/routes', {
    routeName,
    points: treeIds.map((treeId, sequence) => ({ treeId, sequence })),
  });

  return data.data.routeId;
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
