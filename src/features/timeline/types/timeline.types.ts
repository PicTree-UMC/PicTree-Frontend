export type PlanType = "free" | "premium";

/**
 * 기록 분류. 서버 `TimelineCategory` enum 과 값이 정확히 일치해야 한다.
 *
 * ⚠️ 명세서 예시에는 `"기록"` 같은 한글이 적혀 있는데, 서버는 `@IsEnum` 으로
 * 검증하므로 그대로 보내면 400 이 떨어진다. 반드시 아래 값만 보낸다.
 */
export const TIMELINE_CATEGORIES = [
  "VISIT",
  "FOOD",
  "SHOPPING",
  "ACTIVITY",
  "ETC",
] as const;

export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export interface TimelineRecord {
  id: string;
  placeName: string;
  comment: string;
  recordedAt: string;
  /**
   * 서버에 기록이 만들어진 시각(`@default(now())`). `recordedAt`(방문 시각)과
   * 다르다 — 지난 여행을 나중에 올릴 수 있어서다.
   *
   * 상세 시트의 "등록" 줄에만 쓴다. **정렬에는 쓰지 않는다** — 서버가
   * `visitedAt` 으로 페이지를 잘라 주므로 다른 기준으로 다시 정렬하면
   * 순서가 어긋난다.
   */
  createdAt?: string;
  thumbnailUrl?: string | null;
  lat?: number;
  lng?: number;
  /** 연결된 나무 id. 없을 수 있다(나무 없이 기록만 남긴 경우). */
  treeId?: number | null;
  /** 기록 분류. 서버가 enum 으로 내려주며 값 목록은 아직 미확정. */
  category?: string;
  /**
   * 기본 이미지 **식별자** (`"DEFAULT_1"` 같은 값, 서버 `VarChar(20)`).
   *
   * ⚠️ URL 이 아니다. `<img src>` 에 넣으면 깨진다 — 실제로 그래서 사진이
   * 안 뜨고 있었다. 로컬 일러스트와 이어 붙이는 매핑이 생기기 전까지는
   * 화면에서 쓰지 않는다.
   */
  defaultImage?: string | null;
  isFavorite?: boolean;
}

export interface TimelineGroup {
  dateKey: string;
  label: string;
  records: TimelineRecord[];
}

/**
 * `GET /timelines` 응답의 `data`.
 *
 * ⚠️ 명세서와 서버 구현이 다르다. 어느 쪽으로 확정되든 화면이 깨지지 않도록
 * 두 형태를 모두 허용하고 `timelineApi` 에서 하나로 정규화한다.
 *
 * | | 명세서 | 서버(main) |
 * | 목록 | `content` | `items` |
 * | 총개수 | `totalCount` | `totalElements` |
 * | 기록 id | `timelineId` | `id` |
 * | 나무 이름 | `treeName` (평면) | `tree.name` (중첩) |
 * | 기본이미지 | `defaultImage` (평면) | `tree.defaultImage` (중첩) |
 * | 썸네일·즐겨찾기 | `thumbnailUrl`·`hasImage`·`isFavorite` | **없음** |
 */
export interface TimelineApiRecord {
  /** 서버 구현 */
  id?: number;
  /** 명세서 */
  timelineId?: number;
  treeId?: number | null;
  title?: string;
  content?: string | null;
  category?: string;
  visitedAt?: string;
  /** 서버 구현에만 있다 (`TimelineResponseDto.createdAt`) */
  createdAt?: string;

  /** 명세서 — 평면 필드 */
  treeName?: string;
  hasImage?: boolean;
  thumbnailUrl?: string | null;
  defaultImage?: string | null;
  isFavorite?: boolean;

  /** 서버 구현 — 중첩 객체 */
  tree?: {
    id: number;
    name: string;
    mood: string;
    defaultImage: string;
  } | null;
}

export interface TimelineApiPage {
  /** 명세서 */
  content?: TimelineApiRecord[];
  /** 서버 구현 */
  items?: TimelineApiRecord[];
  page?: number;
  size?: number;
  /** 명세서 */
  totalCount?: number;
  /** 서버 구현 */
  totalElements?: number;
  totalPages?: number;
  hasNext?: boolean;
}

/** 정규화된 목록 — 화면·훅이 실제로 쓰는 형태 */
export interface TimelinePage {
  records: TimelineRecord[];
  page: number;
  size: number;
  totalCount: number;
}

export interface TimelineImage {
  imageId: number;
  imageUrl: string;
  /** 정렬 순서. 서버가 안 주면 배열 순서를 그대로 쓴다. */
  sortOrder: number;
}

/**
 * `GET /trees` 응답에서 타임라인이 쓰는 부분만.
 *
 * 목록 썸네일을 잇기 위한 것이라 `treeId` 와 `imageUrl` 만 있으면 된다.
 * 전체 형태는 `features/home/types/tree.ts` 의 `TreeListItem` 에 있다.
 */
export interface TreeListPage {
  items?: {
    treeId: number;
    /** 대표 사진 presigned URL. 사진이 없으면 null. */
    imageUrl: string | null;
  }[];
}

/** `GET /trees/{treeId}/images` 응답의 `data`. */
export interface TreeImageListData {
  images?: {
    imageId: number;
    /** presigned URL, 24시간 유효. */
    imageUrl: string;
    timelineRecordId: number | null;
  }[];
}

/**
 * `GET /timelines/{timelineId}` 응답의 `data`.
 *
 * 목록 레코드와 같은 필드에 나무 이름이 더 붙는 정도다.
 *
 * ⚠️ 사진은 여기 없다. 명세서에는 `images` 가 적혀 있지만 서버
 * `TimelineResponseDto` 에는 없고, `toResponseDto` 도 안 실어 준다.
 * 기록별 사진은 `GET /trees/{treeId}/images?timelineRecordId=` 로 따로 받는다
 * (`useTimelineImages`).
 */
export type TimelineDetailApiRecord = TimelineApiRecord;

/** 정규화된 상세 — 화면·훅이 실제로 쓰는 형태 */
export interface TimelineDetail extends TimelineRecord {
  /** 연결된 나무 이름. 나무 없이 남긴 기록이면 null. */
  treeName: string | null;
}

/**
 * `POST /timelines` 요청 본문.
 *
 * 서버 `CreateTimelineRequestDto` 기준이며 검증이 걸려 있다:
 * - `title` 필수, 100자 이하
 * - `content` 선택, 500자 이하
 * - `category` 필수, `TimelineCategory` 값만 허용
 * - `visitedAt` 필수, ISO 8601 (`new Date().toISOString()` 형태를 권장)
 * - `treeId` 선택. 나무 없이 기록만 남기면 생략하거나 null
 */
export interface CreateTimelineRequest {
  treeId?: number | null;
  title: string;
  content?: string | null;
  category: TimelineCategory;
  visitedAt: string;
}

/**
 * `PATCH /timelines/{timelineId}` 요청 본문.
 *
 * 보낸 필드만 반영되는 부분 수정이다. 검증은 생성과 같되 전부 선택이며,
 * 하나도 안 보내면 400 이 떨어진다.
 *
 * `treeId: null` 은 "나무 연결 해제" 를 뜻한다 — 필드를 생략하는 것과 다르다.
 */
export interface UpdateTimelineRequest {
  treeId?: number | null;
  title?: string;
  content?: string | null;
  category?: TimelineCategory;
  visitedAt?: string;
}
