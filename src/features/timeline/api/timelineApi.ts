import { httpClient } from "@/shared/lib/httpClient";
import type { ApiResponse } from "@/features/auth/types/auth";
import type {
  CreateTimelineRequest,
  TimelineApiPage,
  TimelineApiRecord,
  TimelineDetail,
  TimelineDetailApiRecord,
  TimelinePage,
  TimelineRecord,
  UpdateTimelineRequest,
} from "../types/timeline.types";
import { DEMO_TIMELINE_RECORDS } from "../mocks/timelineRecords";

export const TIMELINE_PAGE_SIZE = 20;

/**
 * 개발 환경에서만 목데이터로 폴백한다 (지도 `treesApi` 와 같은 방식).
 *
 * 로그인·백엔드 없이 화면을 볼 수 있어야 퍼블리싱·리뷰가 가능한데, API 연동 이후
 * 로컬에서는 타임라인이 늘 빈 화면이었다. 배포 빌드에서는 폴백 없이 실 API 만 쓰고
 * 에러도 그대로 노출한다 — 목데이터가 프로덕션에 새어 나가면 안 된다.
 */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

/** 목데이터를 목록 응답 형태로 감싼다. */
const toMockPage = (page: number, size: number): TimelinePage => ({
  records: DEMO_TIMELINE_RECORDS,
  page,
  size,
  totalCount: DEMO_TIMELINE_RECORDS.length,
});

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
 *
 * 토큰이 없거나 호출이 실패하면 개발 환경에 한해 목데이터를 돌려준다.
 */
export const getTimelines = async (
  accessToken: string,
  { page = 1, size = TIMELINE_PAGE_SIZE }: { page?: number; size?: number } = {},
): Promise<TimelinePage> => {
  if (!accessToken && USE_MOCK_FALLBACK) {
    return toMockPage(page, size);
  }

  try {
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
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      return toMockPage(page, size);
    }

    throw error;
  }
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
