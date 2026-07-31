import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { getTerms } from '../api/termsApi';
import { toDisplayTerms } from '../lib/termsDisplay';

export const termsKeys = {
  all: ['terms'] as const,
};

/**
 * 약관 목록 조회 훅. `GET /terms`
 *
 * 인증이 필요 없어 토큰 여부와 무관하게 돈다 — 가입 전 동의 화면에서 부른다.
 *
 * 약관은 자주 바뀌지 않으므로 한 번 받으면 오래 들고 있는다. 동의 화면을 오갈
 * 때마다 다시 받을 이유가 없다.
 */
export const useTerms = () => {
  const query = useQuery({
    queryKey: termsKeys.all,
    queryFn: getTerms,
    staleTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      // 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 한 번 더 시도한다.
      if (status && status >= 400 && status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });

  return { ...query, terms: toDisplayTerms(query.data) };
};
