
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAllTrees } from '@/features/home/hooks/useAllTrees';
import { groupTreesByDate } from '../api/calendarTreesApi';

/*
  `calendarTreesKey` 는 지웠다 — 이 화면 몫의 `/trees` 순회가 따로 있었기에 있던 키다.
  지금은 원본(`treeSourceKey`)을 `select` 로 나눠 쓰므로 무효화도 그쪽 하나로 접힌다
  (이슈 #237).
*/

/**
 * 캘린더에서 날짜를 눌렀을 때 보여줄 나무 목록.
 *
 * **날짜를 처음 누르기 전까지는 요청이 안 나간다**(`enabled`). 나무 전체를 페이지 끝까지
 * 훑는 무거운 호출이라, 잔디만 보고 나가는 사람에게까지 물릴 이유가 없다. 한 번 받고 나면
 * 다른 날짜를 눌러도 캐시에서 꺼내 쓰므로 두 번째 탭부터는 즉시 뜬다.
 *
 * `staleTime` 을 5분 준 것도 같은 이유다 — 이 화면을 보는 동안 나무가 늘어날 일이
 * 없는데(심는 건 카메라 화면이다) 창 포커스마다 전체 순회가 다시 나가면 안 된다.
 *
 * 토큰이 없으면 부르지 않는다 — `GET /trees` 는 인증이 걸려 있어 401 이 뻔하다.
 * ⚠️ `|| import.meta.env.DEV` 를 되살리지 말 것 — 목데이터가 생기지 않는다(`useTrees` 주석).
 */
export const useCalendarTrees = (enabled: boolean) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useAllTrees({
    select: groupTreesByDate,
    enabled: enabled && Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
};
