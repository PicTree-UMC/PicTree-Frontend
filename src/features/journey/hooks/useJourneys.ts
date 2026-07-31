import { useQuery } from '@tanstack/react-query';
import { getJourneys } from '../api/journeyApi';

/** 동선 관련 queryKey 규칙. 삭제·이름변경 훅이 이 키로 목록을 무효화한다. */
export const journeyKeys = {
  all: ['journeys'] as const,
  /** 동선 1건 상세(지도에 그릴 좌표·날짜·순서). */
  detail: (id: number) => ['journeys', id, 'detail'] as const,
  /** 사진 앨범은 동선별 별도 요청이라 동선 id 아래에 둔다. */
  photos: (id: number) => ['journeys', id, 'photos'] as const,
};

/** 저장된 동선 목록 조회 훅. 로딩·에러 상태는 이 훅이 제공한다. */
export const useJourneys = () => {
  return useQuery({
    queryKey: journeyKeys.all,
    queryFn: getJourneys,
  });
};
