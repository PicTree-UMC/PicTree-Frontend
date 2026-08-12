import { unwrapApiResponse } from '../../../shared/lib/apiResponse';
import { httpClient } from '../../../shared/lib/httpClient';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  AIBlogDraftDetail,
  AIBlogDraftListData,
  BlogDraftUsage,
  CreateAIBlogDraftRequest,
  CreateAIBlogDraftResponseData,
  SaveAIBlogDraftRequest,
  SaveAIBlogDraftResponseData,
} from '../types/blog';

/**
 * AI 블로그 초안 목록 조회
 * GET /api/v1/blog-drafts
 */
export const getAIBlogDrafts = async (): Promise<AIBlogDraftListData> => {
  const { data } = await httpClient.get<ApiResponse<AIBlogDraftListData>>('/blog-drafts');

  return unwrapApiResponse(data, 'Failed to get AI blog drafts');
};

/**
 * AI 블로그 초안 사용량 조회
 * GET /api/v1/blog-drafts/usage
 *
 * 목록(`GET /blog-drafts`)을 세는 것과 다르다 — 왜 다른지는 `BlogDraftUsage` 주석 참고.
 * 경로가 `/blog-drafts/{draftId}` 와 겹쳐 보이지만 서버 컨트롤러가 `@Get('usage')` 를
 * `@Get(':draftId')` 보다 위에 두고 있어 `usage` 가 먼저 잡힌다.
 */
export const getBlogDraftUsage = async (): Promise<BlogDraftUsage> => {
  const { data } = await httpClient.get<ApiResponse<BlogDraftUsage>>(
    '/blog-drafts/usage',
  );

  return unwrapApiResponse(data, 'Failed to get AI blog draft usage');
};

/**
 * AI 블로그 초안 생성
 * POST /api/v1/blog-drafts/generate
 *
 * ⚠️ **전역 10초 timeout(`httpClient.ts`)을 여기서만 늘린다.** 장소가 10개 이상이면
 * AI 생성이 10초를 넘기기 쉬운데, 클라이언트가 먼저 끊어도 서버는 계속 처리해 사용량을
 * 그대로 올린다 — 실패로 보이면서 잔량만 깎이는 원인이었다. 다른 엔드포인트는 대부분
 * 짧게 끝나야 정상이라 전역값은 그대로 두고 이 호출만 60초로 늘린다.
 */
export const createAIBlogDraft = async (
  payload: CreateAIBlogDraftRequest,
): Promise<CreateAIBlogDraftResponseData> => {
  const { data } = await httpClient.post<ApiResponse<CreateAIBlogDraftResponseData>>(
    '/blog-drafts/generate',
    payload,
    { timeout: 60000 },
  );

  return unwrapApiResponse(data, 'Failed to create AI blog draft');
};

/**
 * AI 블로그 초안 저장(스크랩)
 * POST /api/v1/blog-drafts
 */
export const saveAIBlogDraft = async (
  payload: SaveAIBlogDraftRequest,
): Promise<SaveAIBlogDraftResponseData> => {
  const { data } = await httpClient.post<ApiResponse<SaveAIBlogDraftResponseData>>(
    '/blog-drafts',
    payload,
  );

  return unwrapApiResponse(data, 'Failed to save AI blog draft');
};

/**
 * AI 블로그 초안 상세 조회
 * GET /api/v1/blog-drafts/{draftId}
 */
export const getAIBlogDraftDetail = async (
  draftId: number,
): Promise<AIBlogDraftDetail> => {
  const { data } = await httpClient.get<ApiResponse<AIBlogDraftDetail>>(`/blog-drafts/${draftId}`);

  return unwrapApiResponse(data, 'Failed to get AI blog draft detail');
};

/**
 * AI 블로그 초안 삭제
 * DELETE /api/v1/blog-drafts/{draftId}
 */
export const deleteAIBlogDraft = async (draftId: number) => {
  const { data } = await httpClient.delete<ApiResponse<null>>(`/blog-drafts/${draftId}`);

  return unwrapApiResponse(data, 'Failed to delete AI blog draft');
};
