import { httpClient } from '../../../shared/lib/httpClient';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  AIBlogDraftListData,
  CreateAIBlogDraftRequest,
  CreateAIBlogDraftResponseData,
  SaveAIBlogDraftRequest,
  SaveAIBlogDraftResponseData,
} from '../types/blog';

/**
 * AI 블로그 초안 목록 조회
 * GET /blogs/ai/drafts
 */
export const getAIBlogDrafts = async (accessToken?: string): Promise<AIBlogDraftListData> => {
  const { data } = await httpClient.get<ApiResponse<AIBlogDraftListData>>('/blogs/ai/drafts', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to get AI blog drafts');
  }

  return data.data;
};

/**
 * AI 블로그 초안 생성
 * POST /blogs/ai/drafts
 */
export const createAIBlogDraft = async (
  accessToken: string | undefined,
  payload: CreateAIBlogDraftRequest,
): Promise<CreateAIBlogDraftResponseData> => {
  const { data } = await httpClient.post<ApiResponse<CreateAIBlogDraftResponseData>>(
    '/blogs/ai/drafts',
    payload,
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined },
  );

  if (!data.success) {
    throw new Error(data.message || 'Failed to create AI blog draft');
  }

  return data.data;
};

/**
 * AI 블로그 초안 저장(스크랩)
 * POST /blogs/drafts
 */
export const saveAIBlogDraft = async (
  accessToken: string | undefined,
  payload: SaveAIBlogDraftRequest,
): Promise<SaveAIBlogDraftResponseData> => {
  const { data } = await httpClient.post<ApiResponse<SaveAIBlogDraftResponseData>>(
    '/blogs/drafts',
    payload,
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined },
  );

  if (!data.success) {
    throw new Error(data.message || 'Failed to save AI blog draft');
  }

  return data.data;
};

/**
 * AI 블로그 초안 상세 조회
 * GET /blogs/drafts/{draftId}
 */
export const getAIBlogDraftDetail = async (
  accessToken: string | undefined,
  draftId: number,
) => {
  const { data } = await httpClient.get<ApiResponse<any>>(`/blogs/drafts/${draftId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to get AI blog draft detail');
  }

  return data.data;
};

/**
 * AI 블로그 초안 삭제
 * DELETE /blogs/drafts/{draftId}
 */
export const deleteAIBlogDraft = async (accessToken: string | undefined, draftId: number) => {
  const { data } = await httpClient.delete<ApiResponse<null>>(`/blogs/drafts/${draftId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete AI blog draft');
  }

  return null;
};
