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
/**
 * GET /api/v1/blog-drafts/usage — 이번 주기 AI 초안 생성 사용량.
 *
 * ⚠️ **`limit` 은 요금제 혜택(`AI_BLOG_MONTHLY`)이 아니라 서버 상수에서 온다.**
 * 백엔드 `blog-drafts.constant.ts` 의 `BLOG_DRAFT_LIMIT`(FREE 1 · PLUS 5 · PRO 20 ·
 * MAX 50)이고, 생성을 막는 판정(`validateMonthlyLimit`)도 이 값을 쓴다. `GET
 * /subscription-plans` 의 혜택값과 어긋날 수 있으므로 **실제로 몇 번 쓸 수 있는지는
 * 이쪽이 정답**이다.
 *
 * ⚠️ `periodStartAt`·`periodEndAt` 에는 **타임존이 안 붙어 있다**(`formatKstDateTime`
 * 이 `2026-08-01T00:00:00` 형태로 만든다). `new Date()` 에 그대로 넣으면 브라우저
 * 로컬시각으로 읽히니, 화면에 날짜를 쓸 일이 생기면 KST 로 보정할 것.
 */
export interface BlogDraftUsage {
  /** 사용량을 판정한 요금제 코드. 'FREE' | 'PLUS' | 'PRO' | 'MAX' */
  plan: string;
  /** 이번 주기 한도(회). */
  limit: number;
  /**
   * 이번 주기에 쓴 횟수.
   *
   * **초안 목록 길이와 다르다.** 서버는 별도 사용 원장(`blogDraftUsage`)을 세므로,
   * 생성만 하고 저장하지 않아도 올라가고 초안을 지워도 안 내려간다 — 실제로 소모된
   * 횟수다.
   */
  usedCount: number;
  /** 남은 횟수. 서버가 `max(limit - usedCount, 0)` 로 계산해 준다. */
  remainingCount: number;
  /** 주기 시작. 무료는 매월 1일, 유료는 결제 승인일 기준. 타임존 없음(위 주석). */
  periodStartAt: string;
  /** 주기 끝(미포함). 타임존 없음(위 주석). */
  periodEndAt: string;
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
  /**
   * 대표 사진 URL. 없으면 빈 문자열이다.
   *
   * ⚠️ 예전 이름은 `defaultImage` 였는데, 서버의 같은 이름 필드는 `"DEFAULT_1"` 같은
   * **식별자**(`VarChar(20)`)라 URL 이 아니다. 이름이 같으니 그 값을 채워도 어색하지 않아
   * 실제로 그렇게 들어갔고 `<img src="DEFAULT_1">` 요청이 나갔다(#209). 이름을 값과
   * 맞춰 다시는 그 값을 담을 자리로 보이지 않게 한다.
   */
  imageUrl: string;
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
