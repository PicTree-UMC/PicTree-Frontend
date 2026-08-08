import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getTravelCalendar } from '../api/calendarApi';
import { isClientError } from '../lib/profileError';

export const calendarKeys = {
  all: ['calendar'] as const,
  month: (year: number, month: number) => ['calendar', year, month] as const,
};

/**
 * 여행 캘린더 조회 훅. `GET /calendar?year=&month=`
 *
 * 달을 넘길 때마다 새로 받는다. queryKey 에 연·월이 들어 있어 이미 본 달로
 * 돌아오면 캐시가 그대로 쓰인다.
 *
 * 화면이 쓰기 좋게 `날짜 → level` 맵으로 바꿔서 돌려준다. 격자가 날짜로 조회하는데
 * 배열이면 매 칸마다 훑어야 한다.
 *
 * 토큰이 없어도 개발 환경에서는 돌린다 — `calendarApi` 가 목데이터로 폴백한다.
 */
export const useTravelCalendar = (year: number, month: number) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: calendarKeys.month(year, month),
    queryFn: () => getTravelCalendar(year, month),
    enabled: Boolean(accessToken) || import.meta.env.DEV,
    /** 4xx 는 반복해도 결과가 같다. 400(잘못된 연·월)도 여기 포함된다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: (query) => !isClientError(query.state.error),
  });

  const levelByDate: Record<string, number> = {};
  for (const day of query.data?.days ?? []) {
    // 0 은 방문 없음이라 담지 않는다 — 격자가 "값이 있으면 그린다" 로 판단한다
    if (day.level > 0) {
      levelByDate[day.date] = day.level;
    }
  }

  return { ...query, levelByDate };
};
