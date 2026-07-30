/** trees API 응답 공통 래퍼 ({ code, data, message, success }). */
export interface ApiEnvelope<TData> {
  code: string;
  message: string;
  success: boolean;
  data: TData;
}

/** 서버 기분 이모지 코드. */
export type TreeMood = 'HAPPY' | 'SAD' | 'NORMAL';

/** GET /trees (지도 목록) 의 개별 아이템. */
export interface TreeListItem {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  mood: TreeMood;
  isFavorite: boolean;
  defaultImage: string;
}

/** GET /trees 페이지네이션 응답. */
export interface TreeListData {
  items: TreeListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
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
 * mood 는 서버가 유저가 고른 이모지 문자를 그대로 저장하므로 문자열이다(읽기용 TreeMood 와 별개).
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
  mood: TreeMood;
  isFavorite: boolean;
  defaultImage: string;
  address: string | null;
  description: string | null;
  images: TreeImage[];
  createdAt: string;
  updatedAt: string;
}
