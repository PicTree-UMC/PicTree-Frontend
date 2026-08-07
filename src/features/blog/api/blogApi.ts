import { httpClient } from '../../../shared/lib/httpClient';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  AIBlogDraftDetail,
  AIBlogDraftListData,
  CreateAIBlogDraftRequest,
  CreateAIBlogDraftResponseData,
  SaveAIBlogDraftRequest,
  SaveAIBlogDraftResponseData,
} from '../types/blog';

const unwrapBlogResponse = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.data;
};

/**
 * AI 블로그 초안 목록 조회
 * GET /api/v1/blog-drafts
 */
export const getAIBlogDrafts = async (): Promise<AIBlogDraftListData> => {
  const { data } = await httpClient.get<ApiResponse<AIBlogDraftListData>>('/blog-drafts');

  return unwrapBlogResponse(data, 'Failed to get AI blog drafts');
};

/**
 * AI 블로그 초안 생성
 * POST /api/v1/blog-drafts/generate
 */
export const createAIBlogDraft = async (
  payload: CreateAIBlogDraftRequest,
): Promise<CreateAIBlogDraftResponseData> => {
  const { data } = await httpClient.post<ApiResponse<CreateAIBlogDraftResponseData>>(
    '/blog-drafts/generate',
    payload,
  );

  return unwrapBlogResponse(data, 'Failed to create AI blog draft');
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

  return unwrapBlogResponse(data, 'Failed to save AI blog draft');
};

/**
 * AI 블로그 초안 상세 조회
 * GET /api/v1/blog-drafts/{draftId}
 */
export const getAIBlogDraftDetail = async (
  draftId: number,
): Promise<AIBlogDraftDetail> => {
  const { data } = await httpClient.get<ApiResponse<AIBlogDraftDetail>>(`/blog-drafts/${draftId}`);

  return unwrapBlogResponse(data, 'Failed to get AI blog draft detail');
};

/**
 * AI 블로그 초안 삭제
 * DELETE /api/v1/blog-drafts/{draftId}
 */
export const deleteAIBlogDraft = async (draftId: number) => {
  const { data } = await httpClient.delete<ApiResponse<null>>(`/blog-drafts/${draftId}`);

  return unwrapBlogResponse(data, 'Failed to delete AI blog draft');
};
