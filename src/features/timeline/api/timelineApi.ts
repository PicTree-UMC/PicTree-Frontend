import { httpClient } from "@/shared/lib/httpClient";
import type { ApiResponse } from "@/features/auth/types/auth";
import type {
  CreateTimelineRequest,
  TimelineApiPage,
  TimelineApiRecord,
  TimelineDetail,
  TimelineDetailApiRecord,
  TimelineImage,
  TimelinePage,
  TimelineRecord,
  TreeImageListData,
  TreeListPage,
  UpdateTimelineRequest,
} from "../types/timeline.types";

export const TIMELINE_PAGE_SIZE = 20;

/** 나무 목록을 한 번에 받기 위한 크기. 서버 허용 최대치다(지도와 같은 값). */
const TREE_PAGE_SIZE = 100;

/**
 * 나무별 대표 사진 URL. `GET /trees`
 *
 * ⚠️ 타임라인 목록(`GET /timelines`)에는 사진이 아예 없다 — 서버
 * `toResponseDto` 가 `tree { id, name, mood, defaultImage }` 만 매핑한다.
 * `tree.defaultImage` 는 `"DEFAULT_1"` 같은 **식별자**(VarChar(20))라
 * `<img src>` 에 넣으면 깨진다.
 *
 * 그래서 사진 URL 이 있는 유일한 목록인 나무 목록을 받아 `treeId` 로 잇는다.
 * 기록별 사진이 아니라 **장소 대표 사진**이라는 한계가 있다. 기록마다 다른
 * 사진을 목록에 띄우려면 `GET /timelines` 응답에 `imageUrl` 이 필요하다
 * (기록별 사진 자체는 `TreeImage.timelineRecordId` 로 이미 저장돼 있고
 * `GET /trees/{treeId}/images` 로 꺼낼 수 있다 — 목록에서 쓰기엔 기록 수만큼
 * 호출해야 해서 안 쓴다).
 */
export const getTreeThumbnails = async (): Promise<Map<number, string>> => {
  const { data } = await httpClient.get<ApiResponse<TreeListPage>>("/trees", {
    params: { size: TREE_PAGE_SIZE },
  });

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  const thumbnails = new Map<number, string>();
  for (const tree of data.data?.items ?? []) {
    // 사진이 없는 나무는 imageUrl 이 null 이다. 넣어 두면 깨진 이미지가 된다.
    if (tree.imageUrl) {
      thumbnails.set(tree.treeId, tree.imageUrl);
    }
  }

  return thumbnails;
};

/**
 * 한 기록에 붙은 사진. `GET /trees/{treeId}/images?timelineRecordId=`
 *
 * 상세 시트에서만 쓴다 — 한 번에 한 기록만 열리므로 호출도 한 번이다.
 * `imageUrl` 은 24시간짜리 presigned URL 이라 오래 캐시하면 안 된다.
 */
export const getTimelineImages = async (
  treeId: number,
  timelineRecordId: string,
): Promise<TimelineImage[]> => {
  const { data } = await httpClient.get<ApiResponse<TreeImageListData>>(
    `/trees/${treeId}/images`,
    { params: { timelineRecordId } },
  );

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  return (data.data?.images ?? []).map((image, index) => ({
    imageId: image.imageId,
    imageUrl: image.imageUrl,
    sortOrder: index,
  }));
};

/**
 * API 레코드를 화면이 쓰는 형태로 변환한다.
 *
 * 코드 용어(placeName·comment·recordedAt)는 유지하고 여기서만 매핑한다
 * — journeyApi 가 `/routes` ↔ `Journey` 를 처리하는 방식과 동일하다.
 *
 * 명세서(평면)와 서버(중첩) 양쪽 필드를 모두 읽는다. 서버에 없는 값
 * (thumbnailUrl·isFavorite)은 각각 null·false 로 떨어져 화면이 깨지지 않는다.
 */
const toTimelineRecord = (record: TimelineApiRecord): TimelineRecord => ({
  id: String(record.id ?? record.timelineId ?? ""),
  // title 이 곧 장소명이다 (명세서 예시에서 treeName 과 같은 값)
  placeName: record.title ?? record.treeName ?? record.tree?.name ?? "",
  comment: record.content ?? "",
  recordedAt: record.visitedAt ?? "",
  // 등록순 정렬용. 서버가 안 주면 방문 시각으로 대체해 정렬이 무너지지 않게 한다.
  createdAt: record.createdAt ?? record.visitedAt ?? "",
  thumbnailUrl: record.thumbnailUrl ?? null,
  treeId: record.treeId ?? record.tree?.id ?? null,
  category: record.category,
  defaultImage: record.defaultImage ?? record.tree?.defaultImage ?? null,
  isFavorite: record.isFavorite ?? false,
});

/**
 * 타임라인 목록 조회. `GET /timelines?page=&size=`
 *
 * 백엔드 컨트롤러에 `AccessTokenGuard` 가 붙어 있어 유효한 토큰이 필요하다.
 * `httpClient` 에 토큰 인터셉터가 없어 호출부가 헤더를 직접 넘긴다.
 */
export const getTimelines = async (
  accessToken: string,
  { page = 1, size = TIMELINE_PAGE_SIZE }: { page?: number; size?: number } = {},
): Promise<TimelinePage> => {
  const { data } = await httpClient.get<ApiResponse<TimelineApiPage>>("/timelines", {
    params: { page, size },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  const body = data.data;
  const records = body?.items ?? body?.content ?? [];

  return {
    records: records.map(toTimelineRecord),
    page: body?.page ?? page,
    size: body?.size ?? size,
    totalCount: body?.totalElements ?? body?.totalCount ?? records.length,
  };
};

/**
 * 타임라인 상세 조회. `GET /timelines/{timelineId}`
 *
 * 목록과 같은 레코드에 `images` 가 더 붙는다.
 * 존재하지 않는 기록이면 404 `TIMELINE_NOT_FOUND` 가 온다 (목록과 달리 진짜 에러).
 */
export const getTimelineDetail = async (
  accessToken: string,
  timelineId: string,
): Promise<TimelineDetail> => {
  const { data } = await httpClient.get<ApiResponse<TimelineDetailApiRecord>>(
    `/timelines/${timelineId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  const record = data.data;

  return {
    ...toTimelineRecord(record),
    treeName: record.treeName ?? record.tree?.name ?? null,
  };
};

/**
 * 타임라인 기록 생성. `POST /timelines`
 *
 * 생성된 기록의 id 를 돌려준다. 응답 형태가 갈리므로 여기서 흡수한다:
 * 명세서는 200 `{ timelineId }`, 서버는 201 에 기록 전체(`{ id, ... }`)를 담아 준다.
 * axios 는 2xx 를 모두 성공으로 보므로 상태코드 차이는 문제되지 않는다.
 */
export const createTimeline = async (
  accessToken: string,
  payload: CreateTimelineRequest,
): Promise<string> => {
  const { data } = await httpClient.post<ApiResponse<TimelineDetailApiRecord>>(
    "/timelines",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  return String(data.data?.timelineId ?? data.data?.id ?? "");
};

/**
 * 타임라인 기록 수정. `PATCH /timelines/{timelineId}`
 *
 * 생성과 마찬가지로 응답 형태가 갈린다 — 명세서는 `{ timelineId }`,
 * 서버는 기록 전체를 준다. 수정된 기록의 id 만 돌려준다.
 */
export const updateTimeline = async (
  accessToken: string,
  timelineId: string,
  payload: UpdateTimelineRequest,
): Promise<string> => {
  const { data } = await httpClient.patch<ApiResponse<TimelineDetailApiRecord>>(
    `/timelines/${timelineId}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }

  return String(data.data?.timelineId ?? data.data?.id ?? timelineId);
};

/**
 * 타임라인 기록 삭제. `DELETE /timelines/{timelineId}`
 *
 * 성공 시 `data` 는 null 이라 돌려줄 값이 없다.
 *
 * ⚠️ 기존 코드는 `/timeline/{id}`(단수) 로 보내고 토큰도 안 붙여 항상 실패했다.
 * 실제 경로는 `/timelines/{id}` 이고 `AccessTokenGuard` 가 걸려 있다.
 */
export const deleteTimeline = async (
  accessToken: string,
  timelineId: string,
): Promise<void> => {
  const { data } = await httpClient.delete<ApiResponse<null>>(
    `/timelines/${timelineId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (data.resultType === "FAIL") {
    throw new Error(data.error.message);
  }
};
