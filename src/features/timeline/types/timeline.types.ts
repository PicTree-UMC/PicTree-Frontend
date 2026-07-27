export type PlanType = "free" | "premium";

export interface TimelineRecord {
  id: string;
  placeName: string;
  comment: string;
  recordedAt: string;
  thumbnailUrl?: string | null;
  lat?: number;
  lng?: number;
  /** 연결된 나무 id. 없을 수 있다(나무 없이 기록만 남긴 경우). */
  treeId?: number | null;
  /** 기록 분류. 서버가 enum 으로 내려주며 값 목록은 아직 미확정. */
  category?: string;
  /** 사진 없는 기록일 때 쓸 기본 이미지 식별자 */
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
