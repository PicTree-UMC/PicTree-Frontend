export interface AIBlogDraft {
  draftId: number;
  title: string;
  thumbnailUrl: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string; // ISO
}

export interface AIBlogDraftListData {
  drafts: AIBlogDraft[];
}

export interface CreateAIBlogDraftRequest {
  startDate: string;
  endDate: string;
  treeIds: number[];
  tone: 'RECORD' | 'SIMPLE' | 'WITTY' | 'CALM';
}

export interface AIBlogDraftItem {
  treeId: number;
  imageUrl: string | null;
  placeName: string;
  content: string;
}

export interface AIBlogDraftDay {
  date: string; // YYYY-MM-DD
  items: AIBlogDraftItem[];
}

export interface CreateAIBlogDraftResponseData {
  title: string;
  days: AIBlogDraftDay[];
  startDate: string;
  endDate: string;
}

export interface SaveAIBlogDraftRequest {
  title: string;
  days: AIBlogDraftDay[];
  startDate: string;
  endDate: string;
}

export interface SaveAIBlogDraftResponseData {
  draftId: number;
}

/** GET /api/v1/blog-drafts/{draftId} 상세 응답. */
export interface AIBlogDraftDetail {
  draftId: number;
  title: string;
  days: AIBlogDraftDay[];
  startDate: string;
  endDate: string;
  createdAt: string;
}
/** AI 초안 생성 단계 상태 (작성 플로우 3번째 스텝 내부에서만 사용). */
export type BlogStatus = 'idle' | 'generating' | 'ready';

/** 화면에서 사용하는 어체 프리셋 식별자. */
export type ToneId = 'emotional' | 'plain' | 'playful' | 'polite';

/**
 * 어체 프리셋. 화면에는 설명과 예문만 두고 서버에는 매핑된 tone 코드를 보낸다.
 */
export interface BlogTone {
  id: ToneId;
  label: string;
  description: string;
  example: string;
}

/** 나무 등록 API 응답을 블로그 작성 화면에 맞게 정규화한 레코드. */
export interface BlogTreeRecord {
  treeId: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  /** 기록 당시 기분 이모지 (예: "😍"). */
  mood: string;
  defaultImage: string;
  createdAt: string;
}

/** 생성된 초안의 장소별 문단. */
export interface BlogSection {
  treeId: number;
  heading: string;
  body: string;
  image: string;
}

/** 생성 결과 화면에서 날짜별로 묶은 초안 항목. */
export interface BlogDay {
  date: string;
  sections: BlogSection[];
}

export interface BlogDraftPreview {
  title: string;
  days: BlogDay[];
}
