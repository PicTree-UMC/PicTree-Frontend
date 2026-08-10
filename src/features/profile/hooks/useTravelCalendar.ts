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
 * ⚠️ **`placeholderData: keepPreviousData` 를 쓰지 않는다 — 여기서는 도움이 안 된다.**
 * 잔디는 `levelByDate[date]` 로 찾는데 그 `date` 는 **지금 보고 있는 달**의 전체 날짜
 * (`YYYY-MM-DD`)다. 이전 달 데이터를 들고 있어 봐야 키가 하나도 안 맞아 잔디는 여전히
 * 비고, 대신 `data` 가 생겨 `isPending` 이 `false` 가 된다 — `TravelCalendarPage` 의
 * `opacity-50` 로딩 표시가 그때 꺼진다. **빈 잔디는 그대로인데 로딩 신호만 사라지는**
 * 셈이라 손해다. (이슈 #238 의 '덤' 항목을 그대로 넣었다가 되돌렸다.)
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
