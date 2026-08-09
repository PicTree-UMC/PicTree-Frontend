import { useQuery } from '@tanstack/react-query';

import { getBlogDraftUsage } from '../api/blogApi';
import type { BlogDraftUsage } from '../types/blog';

/**
 * 사용량 쿼리 키. **초안 목록 키(`['blog-drafts', ...]`)와 붙이지 않는다.**
 *
 * 목록은 저장된 초안이고 사용량은 소모된 횟수라, 한쪽이 바뀌어도 다른 쪽은 그대로인
 * 경우가 있다 — 초안을 지우면 목록은 줄지만 사용량은 안 줄어든다(서버가 별도 원장을
 * 센다). 같은 접두사로 묶으면 그 삭제가 사용량까지 다시 불러 잔량이 되살아난 것처럼
 * 깜빡인다.
 */
export const blogDraftUsageKey = ['blog-draft-usage'] as const;

/**
 * 이번 주기 AI 초안 생성 사용량.
 *
 * 이 값이 없던 동안 화면은 잔량 대신 한도만 말했다("월 5회 제공") — 목록 길이로 세는
 * 건 실제보다 많이 남은 것처럼 보이게 해서 일부러 하지 않았다(`BlogDraftUsage` 주석).
 * 이제 서버가 소모 원장을 세 주므로 잔량을 그대로 쓴다.
 *
 * 로그인 사용자만 의미가 있는 값이라 `enabled` 로 막지 않고, 401 은 httpClient 의
 * 재발급 인터셉터가 처리한다(실패하면 잔량을 모르는 상태로 떨어져 한도만 보인다).
 */
export const useBlogDraftUsage = () =>
  useQuery<BlogDraftUsage>({
    queryKey: blogDraftUsageKey,
    queryFn: getBlogDraftUsage,
    /*
      한 번 생성하면 서버 값이 바뀌므로 오래 들고 있으면 안 된다. 전역 staleTime(60초)을
      그대로 쓰되, 생성 성공 시점에 명시적으로 무효화한다(`useBlogCreate`).
    */
    retry: 1,
  });
