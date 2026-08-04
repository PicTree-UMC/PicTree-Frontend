export type PlanType = "free" | "premium";

/*
 * 기록 분류(`TimelineCategory`: VISIT·FOOD·SHOPPING·ACTIVITY·ETC)는 2026-08-04 에 지웠다.
 * `/timelines` 가 tree 로 합쳐지면서 서버에서 개념 자체가 없어졌고(#123),
 * 되살리지 않기로 했다. 카메라에도 분류를 고르는 UI 는 없었다 — VISIT 로 고정해 보내고
 * 상세에서 다시 보여줄 뿐이라, 사용자가 정한 값이 아니었다.
 */

export interface TimelineRecord {
  id: string;
  placeName: string;
  comment: string;
  recordedAt: string;
  /**
   * 나무가 서버에 만들어진 시각.
   *
   * **`recordedAt` 과 같은 값이다** — 촬영이 곧 등록이라 방문일과 등록일을 구분하지
   * 않기로 했다(#123). 별도 필드로 남겨 둔 건, 지난 여행을 나중에 올리는 기능이
   * 생기면 그때 둘이 갈라지기 때문이다.
   */
  createdAt?: string;
  thumbnailUrl?: string | null;
  lat?: number;
  lng?: number;
  /** 나무 id. 기록이 곧 나무가 된 뒤로 `id` 와 같은 값이다(문자열이냐 숫자냐만 다르다). */
  treeId?: number | null;
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
 * 분류는 되살리지 않기로 했고, 방문일은 백엔드 요청 대기다(HANDOFF 1-1절 1번).
 * 기록이 곧 나무라 `treeId` 로 연결할 대상도 없다.
 */
export interface UpdateTimelineRequest {
  title?: string;
  content?: string | null;
  /** 기분 이모지. 통합으로 **저장 경로가 생겼다** — 예전엔 화면에만 있었다. */
  mood?: string;
}
