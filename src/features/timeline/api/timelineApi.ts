import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope, TreeDetail, TreeListData, TreeListItem } from '@/features/home/types/tree';
import type {
  TimelineDetail,
  TimelineImage,
  TimelinePage,
  TimelineRecord,
  TreeImageListData,
  UpdateTimelineRequest,
} from '../types/timeline.types';

export const TIMELINE_PAGE_SIZE = 20;

/**
 * 타임라인 API 레이어.
 *
 * ⚠️ **2026-08-04 — `/timelines` 는 더 이상 없다.** 백엔드가 timeline 엔티티를 지우고
 * tree 로 합쳤다(이슈 #123). 라우트 자체가 사라져 호출하면 404 다.
 * **이제 타임라인의 한 '기록'은 나무 하나(`Tree`)와 같은 것이다.**
 *
 * 화면이 쓰는 용어(`placeName`·`comment`·`recordedAt`)는 그대로 두고 여기서만 매핑한다
 * — `journeyApi` 가 `/routes` ↔ `Journey` 를 처리하는 방식과 같다. 그래서 이 파일만
 * 갈아끼우면 훅·화면은 거의 그대로 산다.
 *
 * 통합으로 사라진 것:
 * - `createTimeline` — 카메라가 이미 `POST /trees` 로 만든다(`useCreateTreeRecord`).
 *   나무를 만든 뒤 기록을 또 만들던 2단계가 1단계가 됐다.
 * - `getTreeThumbnails` — 목록(`GET /trees`)이 `imageUrl` 을 직접 준다.
 *   사진을 얻으려고 나무 목록을 따로 받아 `treeId` 로 잇던 조인이 필요 없다.
 * - `accessToken` 인자 — `httpClient` 인터셉터가 Bearer 를 붙인다(PR #53).
 *   전부 수동으로 헤더를 싣던 시절의 잔재였다.
 */

/**
 * 🔴 **목록에 날짜와 코멘트가 없다 — 실서버로 확인함(2026-08-04).**
 *
 * `GET /trees` 아이템은 정확히
 * `treeId·name·latitude·longitude·mood·defaultImage·imageUrl·isFavorite` 뿐이다.
 * 타임라인 목록은 **날짜로 묶고 정렬하고 검색**하므로 그대로면 그룹이 무너진다.
 * 상세(`GET /trees/{id}`)에는 `createdAt`·`description` 이 다 있다 — 목록에만 없다.
 *
 * **백엔드 요청은 `createdAt` 과 `description` 을 목록 아이템에 얹어 달라는 것 하나다.**
 * 방문일과 등록일은 같은 것으로 보기로 했으므로(#123, `timelineQuery` 주석) `visitedAt`
 * 이라는 새 필드는 필요 없다. 아래 매핑은 그래도 `visitedAt` 을 먼저 본다 — 나중에 그
 * 필드가 생겨도 코드를 안 고치게 하려는 것뿐이다.
 */
type TreeListItemMaybeDated = TreeListItem & {
  visitedAt?: string;
  createdAt?: string;
  description?: string | null;
};

const toRecordFromListItem = (tree: TreeListItemMaybeDated): TimelineRecord => ({
  // 기록 id 가 곧 나무 id 다. 화면이 문자열로 다루므로 여기서 맞춘다.
  id: String(tree.treeId),
  placeName: tree.name,
  comment: tree.description ?? '',
  // 등록 시각이 곧 방문 시각이다. 지금은 둘 다 안 와서 빈 문자열로 떨어진다(위 주석).
  recordedAt: tree.visitedAt ?? tree.createdAt ?? '',
  createdAt: tree.createdAt ?? '',
  thumbnailUrl: tree.imageUrl,
  lat: tree.latitude,
  lng: tree.longitude,
  treeId: tree.treeId,
  defaultImage: tree.defaultImage,
  isFavorite: tree.isFavorite,
});

/**
 * 타임라인 목록 조회. `GET /trees?page=&size=`
 *
 * 지도(`home/api/treesApi`)와 같은 엔드포인트지만 쓰는 모양이 달라 매핑을 따로 둔다 —
 * 지도는 마커(좌표 중심), 여기는 기록(날짜·사진 중심)이다.
 */
export const getTimelines = async ({
  page = 1,
  size = TIMELINE_PAGE_SIZE,
}: { page?: number; size?: number } = {}): Promise<TimelinePage> => {
  const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees', {
    params: { page, size },
  });

  const body = data.data;
  const items = (body?.items ?? []) as TreeListItemMaybeDated[];

  return {
    records: items.map(toRecordFromListItem),
    page: body?.page ?? page,
    size: body?.size ?? size,
    totalCount: body?.total ?? items.length,
  };
};

/**
 * 타임라인 상세 조회. `GET /trees/{treeId}`
 *
 * 목록과 달리 상세에는 `description`·`createdAt`·`address`·`images` 가 다 있다.
 * 그래서 **날짜가 실제로 보이는 유일한 자리**이기도 하다(목록 주석 참고).
 *
 * 방문일 자리에는 `createdAt` 을 넣는다 — 촬영이 곧 등록이라 둘을 같은 것으로 본다(#123).
 */
export const getTimelineDetail = async (treeId: string): Promise<TimelineDetail> => {
  const { data } = await httpClient.get<ApiEnvelope<TreeDetail>>(`/trees/${treeId}`);
  const tree = data.data;

  return {
    id: String(tree.treeId),
    placeName: tree.name,
    comment: tree.description ?? '',
    // 등록 시각이 곧 방문 시각이다(#123).
    recordedAt: tree.createdAt,
    createdAt: tree.createdAt,
    thumbnailUrl: tree.images?.[0]?.imageUrl ?? null,
    lat: tree.latitude,
    lng: tree.longitude,
    treeId: tree.treeId,
    defaultImage: tree.defaultImage,
    isFavorite: tree.isFavorite,
    // 나무와 기록이 같은 것이 됐으므로 장소명과 같은 값이다. 화면 호환을 위해 남긴다.
    treeName: tree.name,
  };
};

/**
 * 기록에 붙은 사진. `GET /trees/{treeId}/images`
 *
 * 통합 전에는 `?timelineRecordId=` 로 기록별 사진을 걸러 받았다. 기록이 곧 나무가 된
 * 지금은 그 나무의 사진 전부가 곧 그 기록의 사진이라 필터가 필요 없다.
 *
 * `imageUrl` 은 24시간짜리 presigned URL 이라 오래 캐시하면 안 된다.
 */
export const getTimelineImages = async (treeId: number): Promise<TimelineImage[]> => {
  const { data } = await httpClient.get<ApiEnvelope<TreeImageListData>>(
    `/trees/${treeId}/images`,
  );

  return (data.data?.images ?? []).map((image, index) => ({
    imageId: image.imageId,
    imageUrl: image.imageUrl,
    sortOrder: index,
  }));
};

/**
 * 기록 수정. `PATCH /trees/{treeId}`
 *
 * 서버가 받는 필드는 `name·description·address·mood·defaultImage` 다.
 * 화면 용어를 여기서 서버 용어로 옮긴다 — `placeName → name`, `comment → description`.
 *
 * 분류(`category`)는 보내지 않는다 — 서버에서 개념이 없어졌고 되살리지 않기로 했다.
 *
 * 반환값은 수정한 나무의 id — 통합 전 `updateTimeline` 이 기록 id 를 돌려주던 자리다.
 * 서버는 `data: null` 을 주므로 인자를 그대로 되돌린다.
 */
export const updateTimeline = async (
  treeId: string,
  payload: UpdateTimelineRequest,
): Promise<string> => {
  await httpClient.patch<ApiEnvelope<null>>(`/trees/${treeId}`, {
    ...(payload.title !== undefined ? { name: payload.title } : {}),
    ...(payload.content !== undefined ? { description: payload.content } : {}),
    ...(payload.mood !== undefined ? { mood: payload.mood } : {}),
  });

  return treeId;
};

/**
 * 기록 삭제. `DELETE /trees/{treeId}`
 *
 * ⚠️ **이제 기록을 지우면 장소(나무)도 같이 사라진다.** 통합 전에는 기록만 지우고
 * 나무는 지도에 남았다. 삭제 확인 문구가 그 사실을 말하고 있는지 화면에서 확인할 것
 * (`DeleteRecordModal`).
 */
export const deleteTimeline = async (treeId: string): Promise<void> => {
  await httpClient.delete<ApiEnvelope<null>>(`/trees/${treeId}`);
};
