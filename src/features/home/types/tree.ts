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
  /**
   * 한줄평. 안 쓴 장소는 null 이다.
   *
   * 상세에만 있던 것을 2026-08-04 에 목록에도 추가받았다 — 타임라인 목록이 이 값을 쓴다.
   */
  description: string | null;
  /**
   * 등록 시각. **방문 시각과 같은 값으로 쓴다**(#123) — 촬영이 곧 등록이다.
   *
   * 이것도 같은 날 목록에 추가받았다. 이게 없어서 타임라인의 날짜 그룹과
   * 동선 만들기가 통째로 막혀 있었다.
   *
   * ⚠️ **스웨거 example 에는 아직 이 두 필드가 없다.** 손으로 쓴 예시라 실제 응답보다
   * 뒤처져 있다 — 실응답 기준으로 적은 것이다.
   */
  createdAt: string;
}

/** GET /trees 페이지네이션 응답. */
export interface TreeListData {
  items: TreeListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/*
  `NearbyTreeItem`(GET /trees/nearby 응답)은 지웠다 — 그 API 를 부르는 곳이 없어졌다.
  근처 나무 판정은 위 목록에서 프론트가 직접 재고, 결과 모양은
  `lib/nearbyTreeRule.ts` 의 `TreeInRange` 다.
*/

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
