import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useToast } from '@/shared/components';
import { agreeToTerms, getTerms } from '../api/termsApi';
import { toDisplayTerms } from '../lib/termsDisplay';
import { getTermsErrorMessage } from '../lib/termsError';

export const termsKeys = {
  all: ['terms'] as const,
};

/**
 * 약관 목록 조회 훅. `GET /terms`
 *
 * 인증이 필요 없어 토큰 여부와 무관하게 돈다 — 가입 전 동의 화면에서 부른다.
 *
 * 약관은 세션 중에 바뀌지 않는다 — 한 번 받으면 그대로 쓴다. 동의 화면을 오갈 때마다
 * 다시 받을 이유가 없다. (30분이었는데, 그 값에 근거가 있던 게 아니라 "길게" 의 어림이었다.)
 */
export const useTerms = () => {
  const query = useQuery({
    queryKey: termsKeys.all,
    queryFn: getTerms,
    staleTime: Infinity,
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

/**
 * 약관 동의 저장 훅. `POST /users/me/terms-agreements`
 *
 * 성공해야 다음 단계로 넘어간다 — 동의 기록이 서버에 남지 않은 채로 가입을
 * 끝내면 나중에 무엇에 동의했는지 확인할 방법이 없다.
 *
 * ⚠️ 서버 약관 목록이 비어 로컬 문구로 폴백한 경우에는 보낼 id 가 없다.
 * 그때는 저장을 건너뛴다 — 없는 약관 id 를 지어내 보내면 404 만 받는다.
 */
export const useAgreeToTerms = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (agreedTermIds: number[]) => agreeToTerms(agreedTermIds),

    onError: (error) => {
      showToast(
        getTermsErrorMessage(error, '약관 동의 저장에 실패했습니다. 다시 시도해주세요.'),
        'error',
        { placement: 'top' },
      );
    },
  });
};
