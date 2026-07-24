import { useQuery } from '@tanstack/react-query';
import { getJourneys } from '../api/journeyApi';

/** 동선 관련 queryKey 규칙. 삭제·이름변경 훅이 이 키로 목록을 무효화한다. */
export const journeyKeys = {
  all: ['journeys'] as const,
};

/** 저장된 동선 목록 조회 훅. 로딩·에러 상태는 이 훅이 제공한다. */
export const useJourneys = () => {
  return useQuery({
    queryKey: journeyKeys.all,
    queryFn: getJourneys,
  });
};
