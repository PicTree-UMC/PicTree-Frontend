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
