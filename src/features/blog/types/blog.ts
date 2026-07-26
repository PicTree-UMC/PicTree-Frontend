export type BlogStatus = 'free' | 'premium' | 'generating' | 'draft' | 'saved';

export type TreeMood = 'HAPPY' | 'CALM' | 'EXCITED';

/** 나무 등록 API와 향후 기간별 조회 API를 가정한 블로그용 목 레코드. */
export interface BlogTreeRecord {
  treeId: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  mood: TreeMood;
  defaultImage: string;
  createdAt: string;
}
