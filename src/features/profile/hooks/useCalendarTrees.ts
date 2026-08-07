import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { getTreesByDate } from '../api/calendarTreesApi';
import { isClientError } from '../lib/profileError';

/** `/trees` 를 날짜로 나눈 것이라 `calendarKeys`(=/calendar) 밑에 두지 않는다. */
export const calendarTreesKey = ['calendarTrees'] as const;

/**
 * 캘린더에서 날짜를 눌렀을 때 보여줄 나무 목록.
 *
 * **날짜를 처음 누르기 전까지는 요청이 안 나간다**(`enabled`). 나무 전체를 페이지 끝까지
 * 훑는 무거운 호출이라, 잔디만 보고 나가는 사람에게까지 물릴 이유가 없다. 한 번 받고 나면
 * 다른 날짜를 눌러도 캐시에서 꺼내 쓰므로 두 번째 탭부터는 즉시 뜬다.
 *
 * `staleTime` 을 5분 준 것도 같은 이유다 — 이 화면을 보는 동안 나무가 늘어날 일이
 * 없는데(심는 건 카메라 화면이다) 창 포커스마다 전체 순회가 다시 나가면 안 된다.
 */
export const useCalendarTrees = (enabled: boolean) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: calendarTreesKey,
    queryFn: getTreesByDate,
    enabled: enabled && (Boolean(accessToken) || import.meta.env.DEV),
    staleTime: 5 * 60 * 1000,
    /** 4xx 는 반복해도 결과가 같다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
  });
};
