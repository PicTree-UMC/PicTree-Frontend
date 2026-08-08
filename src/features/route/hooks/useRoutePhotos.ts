import { useQuery } from '@tanstack/react-query';
import { getRoutePhotos } from '../api/routeApi';
import { routeKeys } from './useSavedRoutes';

/**
 * 동선 사진 앨범 조회 훅.
 *
 * 목록 응답에 사진이 없어서 앨범을 열 때 따로 받아온다.
 * 시트가 열린 뒤에야 마운트되므로 목록 화면에서는 요청이 나가지 않는다.
 */
export const useRoutePhotos = (routeId: number) => {
  return useQuery({
    queryKey: routeKeys.photos(routeId),
    queryFn: () => getRoutePhotos(routeId),
  });
};
