import { useQuery } from '@tanstack/react-query';
import { getRoutes } from '../api/routeApi';

/** 동선 관련 queryKey 규칙. 삭제·이름변경 훅이 이 키로 목록을 무효화한다. */
export const routeKeys = {
  all: ['routes'] as const,
  /** 동선 1건 상세(지도에 그릴 좌표·날짜·순서). */
  detail: (id: number) => ['routes', id, 'detail'] as const,
  /** 사진 앨범은 동선별 별도 요청이라 동선 id 아래에 둔다. */
  photos: (id: number) => ['routes', id, 'photos'] as const,
};

/**
 * 저장된 동선 목록 조회 훅. 로딩·에러 상태는 이 훅이 제공한다.
 *
 * **`useRoutes` 로 부르지 않는다** — react-router 가 같은 이름을 export 해서, 한 파일에서
 * 둘 다 쓰면 import 가 충돌한다. 도메인 전체가 `route` 로 통일된 뒤 한정어가 남은 유일한 자리다.
 */
export const useSavedRoutes = () => {
  return useQuery({
    queryKey: routeKeys.all,
    queryFn: getRoutes,
  });
};
