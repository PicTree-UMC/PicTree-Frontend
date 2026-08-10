import { httpClient } from '@/shared/lib/httpClient';
import type { MapMarkerData } from '../hooks/useMapMarkers';
import type {
  ApiEnvelope,
  CreateTreeData,
  CreateTreeRequest,
  TreeDetail,
  TreeImage,
  TreeImageUploadData,
  TreeListData,
  TreeListItem,
} from '../types/tree';
import { detailToMarker } from '../lib/treeMapping';

/**
 * 나무(지도) API 레이어.
 *
 * 개발 환경(import.meta.env.DEV)에서는 로그인/백엔드가 없어도 화면이 비지 않도록
 * 토큰이 없거나 API 호출이 실패하면 목데이터로 폴백한다.
 * 프로덕션(배포)에서는 폴백 없이 실 API 만 사용하고 에러는 그대로 노출한다.
 */

/** 서버가 허용하는 최대 페이지 크기(`TreePagination.MAX_SIZE`). */
const MAX_PAGE_SIZE = 100;

/** `GET /trees` 한 페이지. ⚠️ `page` 는 **1-based** 다 — 0 을 넣으면 서버가 첫 장을 안 준다. */
async function fetchTreePage(page: number): Promise<TreeListData> {
  const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees', {
    params: { page, size: MAX_PAGE_SIZE },
  });

  return data.data;
}

/**
 * 내 나무 전체.
 *
 * ⚠️ **`GET /trees` 에는 전체 조회도 날짜 필터도 없다.** 한 장이 최대 100개라, 한 번만
 * 부르면 101번째부터 조용히 빠진다 — 지도 마커도 근처 나무 배너도 그렇게 잘려 있었다
 * (이슈 #200). 그래서 첫 응답의 `totalPages` 를 보고 남은 페이지를 **한 번에 병렬로**
 * 받는다. 왕복은 나무 수와 무관하게 2회이고, 100그루 이하면 1회로 예전과 같다.
 *
 * 나무가 수천 그루가 되면 이 방식도 답이 아니다. 그때는 지도 뷰포트(bbox) 조회가
 * 있어야 하고, 생기면 이 함수만 갈아끼우면 된다.
 *
 * 캘린더(`calendarTreesApi`)가 복사해 두었던 같은 순회를 여기로 모았다. 따로 놀면
 * 이번처럼 한 곳만 상한에 걸린 채 남는다. (사진 용량도 여기 묶여 있었는데, `GET
 * /trees/summary` 가 생기면서 순회 자체가 필요 없어져 빠졌다.)
 *
 * ⚠️ **`treeId` 로 한 번 거른다.** `/trees` 는 스웨거에 요청 파라미터가 없는데 실제로는
 * `page` 가 먹는 상태라, 서버가 이걸 무시하게 되면 같은 페이지를 여러 번 받는다.
 * 순차 순회라면 무한 루프가 되겠지만 여기는 `totalPages` 만큼만 병렬로 부르므로
 * 멈추기는 한다 — 대신 **마커가 겹쳐 찍힌다.** 거르는 값이 싸서 그냥 막아 둔다.
 * (`blogPlacesApi`·`routeCandidatesApi` 도 같은 이유로 각자 `seen` 을 들고 있다.)
 */
export async function fetchAllTreeItems(): Promise<TreeListItem[]> {
  const first = await fetchTreePage(1);

  // totalPages 를 못 받으면 첫 페이지만 쓴다 — 지어내는 것보다 적게 세는 편이 낫다.
  const totalPages = first.totalPages ?? 1;
  const rest =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) => fetchTreePage(index + 2)),
        )
      : [];

  const byId = new Map<number, TreeListItem>();
  for (const item of [first, ...rest].flatMap((page) => page.items ?? [])) {
    if (!byId.has(item.treeId)) byId.set(item.treeId, item);
  }

  return [...byId.values()];
}

/*
  `getTreeCount`(GET /trees?size=1 의 `total`)는 지웠다. 마이페이지 요약 한 곳이 쓰던
  것인데 그 값이 `GET /trees/summary` 에 사진 장수·용량과 함께 실려 온다
  (`profile/api/treeStatsApi`). 목록 응답의 `total` 은 그대로 있으니 되살릴 일이 생기면
  한 줄이다.
*/

/** 지도에 찍을 내 나무 목록 조회. */
/*
  `getTrees()` 는 지웠다 — `fetchAllTreeItems()` 결과를 마커로 옮기고 DEV 목 폴백을
  씌우던 래퍼였는데, 그 둘이 각각 원본 쿼리(`useAllTrees`)와 지도 훅(`useTrees`)으로
  갈라졌다(이슈 #237). **폴백을 api 레이어에 두면 그 함수를 쓰는 곳마다 가짜 `treeId`
  가 흘러든다** — 동선 후보가 이 파일 재사용을 일부러 피했던 이유가 그것이었다.
*/

/*
  `getNearbyTrees`(GET /trees/nearby)는 지웠다. 부르는 곳이 지도 위 안내 카드 하나뿐이었는데,
  그 카드가 위 `getTrees` 목록에서 직접 거리를 재게 되면서(`findNearbyTrees`) 요청이
  통째로 없어졌다 — 좌표까지 들어 있는 같은 나무를 두 번 받아 오던 셈이었다.

  서버 엔드포인트는 그대로 있다. 되살릴 일이 생기면 반경은 서버 상수
  `NEARBY_TREE_RADIUS_M = 100` 이고 `radius` 파라미터는 받지 않는다는 것,
  그리고 그 쿼리에 `userId` 조건이 없어 **남의 나무가 섞여 온다**는 것만 기억하면 된다.
*/

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
