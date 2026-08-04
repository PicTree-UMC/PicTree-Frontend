export type PlanType = "free" | "premium";

/**
 * 기록 분류.
 *
 * ⚠️ **2026-08-04 — 서버에 이 개념이 없어졌다.** `/timelines` 가 지워지면서
 * `TimelineCategory` enum 도 함께 사라졌고 `Tree` 에는 대응 필드가 없다(#123).
 * 지금은 어떤 응답에서도 분류가 오지 않는다 — 상세 시트의 '분류' 줄은 그래서 안 뜬다.
 *
 * 되살릴지 정해지면(HANDOFF 1-0절) 이 목록을 그대로 쓰고, 안 쓸 거면 이 파일에서 지운다.
 */
export const TIMELINE_CATEGORIES = ['VISIT', 'FOOD', 'SHOPPING', 'ACTIVITY', 'ETC'] as const;

export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export interface TimelineRecord {
  id: string;
  placeName: string;
  comment: string;
  recordedAt: string;
  /**
   * 나무가 서버에 만들어진 시각. 원래 `recordedAt`(방문 시각)과 다른 값이었지만,
   * **통합 뒤로는 둘이 같다** — `Tree` 에 방문일이 없어서 등록 시각이 그 자리를 대신한다.
   * 백엔드가 `visitedAt` 을 주면 갈라진다(HANDOFF 1-1절 1번).
   *
   * **정렬에는 쓰지 않는다** — 서버 페이지 순서와 어긋난다.
   */
  createdAt?: string;
  thumbnailUrl?: string | null;
  lat?: number;
  lng?: number;
  /** 나무 id. 기록이 곧 나무가 된 뒤로 `id` 와 같은 값이다(문자열이냐 숫자냐만 다르다). */
  treeId?: number | null;
  /** 기록 분류. ⚠️ 서버에 없어져 지금은 항상 비어 있다 — `TIMELINE_CATEGORIES` 주석 참고. */
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
 * 정규화된 목록 — 화면·훅이 실제로 쓰는 형태.
 *
 * ⚠️ 서버 응답 타입(`TimelineApiRecord`·`TimelineApiPage`)은 2026-08-04 에 지웠다.
 * `/timelines` 가 없어지고 기록이 나무가 되면서(#123) 원본이 `TreeListItem`·`TreeDetail`
 * (`features/home/types/tree.ts`) 로 바뀌었기 때문이다. 매핑은 `timelineApi` 안에 있다.
 */
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

/** `GET /trees/{treeId}/images` 응답의 `data`. */
export interface TreeImageListData {
  images?: {
    imageId: number;
    /** presigned URL, 24시간 유효. */
    imageUrl: string;
    timelineRecordId: number | null;
  }[];
}

/** 정규화된 상세 — 화면·훅이 실제로 쓰는 형태 */
export interface TimelineDetail extends TimelineRecord {
  /**
   * 나무 이름. 기록이 곧 나무가 된 뒤로 `placeName` 과 같은 값이다.
   * 화면 호환을 위해 남겨 뒀고, 화면 정리 때 없앨 수 있다.
   */
  treeName: string | null;
}

/**
 * 기록 수정 요청. 화면 용어 기준이며 `timelineApi` 가 서버 필드로 옮긴다
 * (`title → name`, `content → description`).
 *
 * 보낸 필드만 반영되는 부분 수정이다.
 *
 * ⚠️ 통합(#123)으로 **`category`·`visitedAt`·`treeId` 가 사라졌다.**
 * `Tree` 에 분류·방문일 필드가 없고, 기록이 곧 나무라 연결할 대상도 없다.
 * 분류를 되살릴지는 백엔드 확인 대기(HANDOFF 1-0절).
 */
export interface UpdateTimelineRequest {
  title?: string;
  content?: string | null;
  /** 기분 이모지. 통합으로 **저장 경로가 생겼다** — 예전엔 화면에만 있었다. */
  mood?: string;
}
