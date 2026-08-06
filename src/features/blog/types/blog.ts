export interface AIBlogDraft {
  draftId: number;
  title: string;
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

export interface CreateAIBlogDraftResponseData {
  title: string;
  items: { placeName: string; content: string }[];
  startDate: string;
  endDate: string;
}

export interface SaveAIBlogDraftRequest {
  title: string;
  items: {
    placeName: string;
    content: string;
  }[];
  startDate: string;
  endDate: string;
  treeIds: number[];
}

export interface SaveAIBlogDraftResponseData {
  draftId: number;
}

/** GET /blogs/drafts/{draftId} 상세 응답. */
export interface AIBlogDraftDetail {
  draftId: number;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  treeIds: number[];
  createdAt: string;
}
/** AI 초안 생성 단계 상태 (작성 플로우 3번째 스텝 내부에서만 사용). */
export type BlogStatus = 'idle' | 'generating' | 'ready';

/** 어체 프리셋 식별자. 선택값으로 저장·향후 서버 전송되는 안정 키. */
export type ToneId = 'emotional' | 'plain' | 'playful' | 'polite';

/**
 * 어체 프리셋. 문체(존댓말/반말)는 각 어체에 미리 탑재한다.
 * `prompt`는 현재는 목 생성기 입력 겸 설계 문서이며,
 * 실제 백엔드 연동 시엔 프론트는 `id`만 보내고 프롬프트 템플릿은 서버가 소유한다.
 */
export interface BlogTone {
  id: ToneId;
  label: string;
  description: string;
  example: string;
  prompt: string;
}

/** 나무 등록 API와 향후 기간별 조회 API를 가정한 블로그용 목 레코드. */
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
  /** 기록 당시 기분 이모지 (예: "😍"). 카드뉴스 뱃지에 사용. */
  mood: string;
}

/** 저장된 블로그. 메인 목록 렌더와 저장에 필요한 최소 필드. */
export interface SavedBlog {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  toneId: ToneId;
  sections: BlogSection[];
  savedAt: string;
}
