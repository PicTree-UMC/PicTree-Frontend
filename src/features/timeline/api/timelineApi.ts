import { httpClient } from "@/shared/lib/httpClient";
import type { ApiResponse } from "@/features/auth/types/auth";
import type {
  TimelineApiPage,
  TimelineApiRecord,
  TimelineDetail,
  TimelineDetailApiRecord,
  TimelinePage,
  TimelineRecord,
} from "../types/timeline.types";

export const TIMELINE_PAGE_SIZE = 20;

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
    // sortOrder 가 없으면 배열 순서를 그대로 쓴다
    images: (record.images ?? [])
      .map((image, index) => ({ ...image, sortOrder: image.sortOrder ?? index }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
};

export const deleteRecord = async (recordId: string): Promise<void> => {
  await httpClient.delete(`/timeline/${recordId}`);
};
