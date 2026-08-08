import { useQuery } from '@tanstack/react-query';
import { getRouteDetail } from '../api/routeApi';
import { routeKeys } from './useSavedRoutes';

/**
 * 저장된 동선 1건 조회 훅. `/journey/view/:routeId` 로 들어왔을 때만 돈다.
 *
 * `routeId` 가 없으면(= 새 동선 만들기 모드) `enabled:false` 로 요청 자체를 막는다 —
 * 같은 페이지가 두 모드를 겸하므로 훅 호출은 항상 일어난다.
 */
export const useRouteDetail = (routeId: number | undefined) =>
  useQuery({
    queryKey: routeKeys.detail(routeId ?? -1),
    queryFn: () => getRouteDetail(routeId as number),
    enabled: routeId !== undefined,
  });
