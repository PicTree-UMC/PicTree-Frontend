import { useQuery } from '@tanstack/react-query';
import { getRoutePhotos } from '../api/routeApi';
import { routeKeys } from './useSavedRoutes';

/**
 * 동선 사진 앨범 조회 훅.
 *
 * 목록 응답에 사진이 없어서 앨범을 열 때 따로 받아온다.
 * 시트가 열린 뒤에야 마운트되므로 목록 화면에서는 요청이 나가지 않는다.
 *
 * `routeId` 가 없으면 요청을 막는다(`useRouteDetail` 과 같은 규칙) — AI 초안 작성은
 * 동선을 고르기 전에도 이 훅을 부르는 자리라, 안 막으면 `/routes/undefined/images` 가 나간다.
 */
export const useRoutePhotos = (routeId: number | undefined) => {
  return useQuery({
    queryKey: routeKeys.photos(routeId ?? -1),
    queryFn: () => getRoutePhotos(routeId as number),
    enabled: routeId !== undefined,
  });
};
