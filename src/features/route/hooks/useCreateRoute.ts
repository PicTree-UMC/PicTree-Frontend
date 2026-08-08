import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoute } from '../api/routeApi';
import { routeKeys } from './useSavedRoutes';

interface CreateRouteVars {
  routeName: string;
  /** 방문 순서대로. 배열 순서가 그대로 `sequence` 가 된다. */
  treeIds: number[];
}

/**
 * 동선 저장 mutation 훅.
 *
 * 성공하면 목록을 무효화한다 — 응답이 `routeId` 뿐이라 저장된 동선은 목록을 다시 받아야 뜬다.
 * **토스트는 여기서 띄우지 않는다**(다른 동선 훅들과 다른 점): 이 화면의 안내는 지도를 가리지
 * 않도록 전부 `placement:'top'` 이라, 호출부가 띄워야 위치가 맞는다.
 */
export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeName, treeIds }: CreateRouteVars) => createRoute(routeName, treeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.all });
    },
  });
};
