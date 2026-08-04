/** trees API 응답 공통 래퍼 ({ code, data, message, success }). */
export interface ApiEnvelope<TData> {
  code: string;
  message: string;
  success: boolean;
  data: TData;
}

/** GET /trees (지도 목록) 의 개별 아이템. */
export interface TreeListItem {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  /** 서버가 유저가 고른 이모지 문자를 그대로 저장하므로 문자열이다. */
  mood: string;
  isFavorite: boolean;
  defaultImage: string;
  /** 대표 사진 presigned URL. 사진이 없으면 null → 기본 이미지로 표시. */
  imageUrl: string | null;
}

/** GET /trees 페이지네이션 응답. */
export interface TreeListData {
  items: TreeListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/**
 * `GET /trees/nearby` 의 개별 아이템.
 *
 * ⚠️ 명세서와 서버(`develop`)가 다르다. 아래는 **서버 `NearbyTreeResponseDto`
 * 기준**이다. 명세서에 적힌 `description`·`address`·`isFavorite` 은 서버가 주지
 * 않고, 대신 `mood` 를 준다. 명세서의 `defaultImage: "HAPPY"` 예시는 mood 값과
 * 뒤바뀐 것으로 보인다 — 실제 값은 `"DEFAULT_1"` 형태다.
 */
export interface NearbyTreeItem {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  /** 유저가 고른 이모지 문자. */
  mood: string;
  /** 기본 이미지 **식별자**(`"DEFAULT_1"`). URL 이 아니라 `<img src>` 에 못 쓴다. */
  defaultImage: string;
  /** 현재 위치로부터의 거리(미터). 서버가 가까운 순으로 정렬해 준다. */
  distanceM: number;
}

/** 나무 사진. */
export interface TreeImage {
  imageId: number;
  imageUrl: string;
  sortOrder: number;
  timelineRecordId: number | null;
}

/**
 * POST /trees 요청 바디.
 * mood 는 서버가 유저가 고른 이모지 문자를 그대로 저장하므로 문자열이다.
 * latitude/longitude/name/mood 는 필수, 나머지는 선택.
 */
export interface CreateTreeRequest {
  name: string;
  latitude: number;
  longitude: number;
  mood: string;
  description?: string;
  address?: string;
  defaultImage?: string;
}

/** POST /trees 응답 데이터. adRequired: 무료 사용자 2개 등록마다 광고 노출 필요. */
export interface CreateTreeData {
  treeId: number;
  adRequired: boolean;
}

/** POST /trees/{treeId}/images 응답 데이터(단일 파일 업로드). */
export interface TreeImageUploadData {
  image: TreeImage;
}

/** GET /trees/{treeId} 상세 응답. */
export interface TreeDetail {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  mood: string;
  isFavorite: boolean;
  defaultImage: string;
  address: string | null;
  description: string | null;
  images: TreeImage[];
  createdAt: string;
  updatedAt: string;
}
