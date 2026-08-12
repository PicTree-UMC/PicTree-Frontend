import { httpClient } from '@/shared/lib/httpClient';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import type { ApiEnvelope, TreeListItem } from '@/features/home/types/tree';
import type {
  TimelineRecord,
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
 * — `routeApi` 가 `/routes` ↔ `Route` 를 처리하는 방식과 같다. 그래서 이 파일만
 * 갈아끼우면 훅·화면은 거의 그대로 산다.
 *
 * 통합으로 사라진 것:
 * - `createTimeline` — 카메라가 이미 `POST /trees` 로 만든다(`useCreateTreeRecord`).
 *   나무를 만든 뒤 기록을 또 만들던 2단계가 1단계가 됐다.
 * - `getTreeThumbnails` — 목록(`GET /trees`)이 `imageUrl` 을 직접 준다.
 *   사진을 얻으려고 나무 목록을 따로 받아 `treeId` 로 잇던 조인이 필요 없다.
 * - `accessToken` 인자 — `httpClient` 인터셉터가 Bearer 를 붙인다(PR #53).
 *   전부 수동으로 헤더를 싣던 시절의 잔재였다.
 *
 * 화면 개편으로 사라진 것:
 * - `getTimelineDetail`(`GET /trees/{treeId}`)·`getTimelineImages`(`GET /trees/{treeId}/images`)
 *   — 격자를 즐겨찾기로 옮기며 유일한 호출부이던 상세 시트가 없어졌다. 목록이 카드에
 *   필요한 값을 다 주므로 지금 화면들은 목록 한 번으로 산다. 상세 화면이 다시 생기면
 *   되살릴 것(`git log` 에 매핑이 남아 있다).
 */

/**
 * 목록 아이템 → 화면이 쓰는 기록.
 *
 * `createdAt`·`description` 은 2026-08-04 에 목록에 추가받은 필드다. 그 전에는 목록에
 * 날짜가 없어 날짜 그룹이 통째로 무너졌고, 상세를 항목마다 부르는 우회(N+1)를 검토했다.
 * **필드가 오면서 그 우회는 필요 없어졌다** — 목록 한 번으로 카드가 다 채워진다.
 */
export const toRecordFromListItem = (tree: TreeListItem): TimelineRecord => ({
  // 기록 id 가 곧 나무 id 다. 화면이 문자열로 다루므로 여기서 맞춘다.
  id: String(tree.treeId),
  placeName: tree.name,
  comment: tree.description ?? '',
  // 등록 시각이 곧 방문 시각이다(#123).
  recordedAt: tree.createdAt,
  createdAt: tree.createdAt,
  thumbnailUrl: tree.imageUrl,
  lat: tree.latitude,
  lng: tree.longitude,
  treeId: tree.treeId,
  defaultImage: tree.defaultImage,
  isFavorite: tree.isFavorite,
  mood: tree.mood,
});

/*
  `getTimelines()` 와 `TimelinePage` 는 지웠다 — 이 화면 몫으로 `GET /trees` 를 1페이지
  받던 함수다. **다섯 소비처 중 여기만 1페이지였고**, 그래서 21번째 기록부터는 목록에도
  검색에도 안 걸렸다(#200 과 같은 종류의 잘림). 지금은 원본 한 벌을 `select` 로 나눠 쓴다
  (이슈 #237). 남은 `toRecordFromListItem` 이 그 `select` 다.
*/

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
 *
 * ⚠️ **`unwrapApiResponse` 를 값이 아니라 검사로만 쓴다.** 서버가 `data:null` 을 주므로
 * 언랩의 결과는 항상 `null` 이다 — 그걸 반환하면 위 규약이 깨진다. 그래도 불러야 하는
 * 이유는 200 + `success:false` 를 여기 말고는 볼 자리가 없어서다(이슈 #308).
 */
export const updateTimeline = async (
  treeId: string,
  payload: UpdateTimelineRequest,
): Promise<string> => {
  const { data } = await httpClient.patch<ApiEnvelope<null>>(`/trees/${treeId}`, {
    ...(payload.title !== undefined ? { name: payload.title } : {}),
    ...(payload.content !== undefined ? { description: payload.content } : {}),
    ...(payload.mood !== undefined ? { mood: payload.mood } : {}),
  });
  unwrapApiResponse(data);

  return treeId;
};

/**
 * 기록 삭제. `DELETE /trees/{treeId}`
 *
 * ⚠️ **이제 기록을 지우면 장소(나무)도 같이 사라진다.** 통합 전에는 기록만 지우고
 * 나무는 지도에 남았다. 삭제 확인 문구가 그 사실을 말하고 있는지 화면에서 확인할 것
 * (`TimelinePage` 의 `DeleteConfirmModal`).
 */
export const deleteTimeline = async (treeId: string): Promise<void> => {
  const { data } = await httpClient.delete<ApiEnvelope<null>>(`/trees/${treeId}`);
  unwrapApiResponse(data);
};
