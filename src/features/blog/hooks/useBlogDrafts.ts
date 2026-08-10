import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteAIBlogDraft,
  getAIBlogDraftDetail,
  getAIBlogDrafts,
  saveAIBlogDraft,
} from '../api/blogApi';
import type { AIBlogDraft, SaveAIBlogDraftRequest } from '../types/blog';

/**
 * 초안 쿼리 키.
 *
 * ⚠️ **사용량 키(`blogDraftUsageKey = ['blog-draft-usage']`)와 접두사를 나누지 않는다.**
 * 초안을 지워도 이미 소모된 생성 횟수는 안 돌아오는데(서버가 별도 원장을 센다), 한
 * 접두사로 묶으면 삭제 무효화가 사용량까지 다시 불러 **잔량이 되살아난 것처럼 깜빡인다**.
 * 그래서 `blog-drafts` 와 `blog-draft-usage` 는 이름이 비슷해도 남남이다
 * (`useBlogDraftUsage` 주석 참고).
 */
export const blogDraftKeys = {
  all: ['blog-drafts'] as const,
  list: () => ['blog-drafts', 'list'] as const,
  detail: (draftId: number) => ['blog-drafts', 'detail', draftId] as const,
};

/**
 * 저장된 초안 목록.
 *
 * ⚠️ **이 화면만 zustand 로 서버 상태를 들고 있었다.** 마운트마다 `fetchSavedBlogs()` 를
 * 부르고 `isLoading: true` 로 시작해서, **블로그 탭에 들어올 때마다 55vh 짜리 전체
 * 스피너를 다시 봤다.** 캐시가 없으니 나갔다 돌아오는 것도 매번 처음부터였다.
 *
 * 같은 feature 안에서 계층이 갈려 있기도 했다 — 상세는 이미 `useQuery` 였다.
 * 전역 `staleTime`(60초) 안에서는 즉시 목록이 뜨고 갱신은 뒤에서 돈다.
 */
export const useBlogDrafts = () =>
  useQuery({
    queryKey: blogDraftKeys.list(),
    queryFn: async () => (await getAIBlogDrafts()).drafts,
  });

/** 초안 1건 상세. 목록과 같은 네임스페이스를 쓴다 — 무효화가 둘을 함께 잡는다. */
export const useBlogDraftDetail = (draftId: number) =>
  useQuery({
    queryKey: blogDraftKeys.detail(draftId),
    queryFn: () => getAIBlogDraftDetail(draftId),
    enabled: Number.isInteger(draftId) && draftId > 0,
  });

/**
 * 초안 저장.
 *
 * 종전에는 저장한 뒤 **목록을 직접 다시 받아** store 에 밀어 넣었다. 그 요청은 저장
 * 화면에서 나가는데 결과를 쓰는 건 목록 화면이라, 목록을 안 볼 사람에게도 왕복이
 * 한 번 더 있었다. 무효화만 걸고 실제 조회는 목록이 필요할 때 한다.
 */
export const useSaveBlogDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAIBlogDraftRequest) => saveAIBlogDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogDraftKeys.list() });
    },
  });
};

/**
 * 초안 삭제. **낙관적으로 목록에서 먼저 뺀다.**
 *
 * 삭제는 상세 화면에서 일어나고 성공하면 곧바로 목록으로 되돌아간다. 서버 응답을
 * 기다렸다 무효화만 하면, 돌아온 목록에 방금 지운 카드가 잠깐 남아 있다가 사라진다 —
 * 이미 지운 걸 아는 사용자에게는 그게 실패로 읽힌다.
 *
 * 실패하면 스냅샷으로 되돌린다. 삭제는 되돌릴 수 없는 동작이라 **낙관적 갱신이
 * 어긋났을 때 원래대로 돌아오는 것**이 특히 중요하다.
 */
export const useDeleteBlogDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: number) => deleteAIBlogDraft(draftId),

    onMutate: async (draftId) => {
      // 진행 중인 목록 조회가 나중에 도착해 방금 지운 항목을 되살리지 않게 막는다.
      await queryClient.cancelQueries({ queryKey: blogDraftKeys.list() });

      const previous = queryClient.getQueryData<AIBlogDraft[]>(blogDraftKeys.list());

      queryClient.setQueryData<AIBlogDraft[]>(blogDraftKeys.list(), (drafts) =>
        drafts?.filter((draft) => draft.draftId !== draftId),
      );

      return { previous };
    },

    onError: (_error, _draftId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(blogDraftKeys.list(), context.previous);
      }
    },

    onSuccess: (_data, draftId) => {
      // 지운 초안의 상세는 다시 열릴 일이 없다. 남겨 두면 뒤로 가기로 404 를 본다.
      queryClient.removeQueries({ queryKey: blogDraftKeys.detail(draftId) });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogDraftKeys.list() });
    },
  });
};
