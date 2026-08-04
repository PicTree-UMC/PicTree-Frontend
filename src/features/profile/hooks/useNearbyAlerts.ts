import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  checkNearbyAlerts,
  getNearbyAlertLogs,
  NEARBY_ALERT_PAGE_SIZE,
  openNearbyAlertLog,
} from '../api/nearbyAlertApi';
import { isClientError } from '../lib/profileError';
import type { NearbyAlertLogPage } from '../types/nearbyAlert';

export const nearbyAlertKeys = {
  all: ['nearby-alerts'] as const,
  logs: (page: number, size: number) =>
    [...nearbyAlertKeys.all, 'logs', page, size] as const,
};

/**
 * 근처 나무 알림 체크 훅. `POST /nearby-alerts/check`
 *
 * 위치가 바뀔 때 부른다. 조회가 아니라 **발송을 일으키는 동작**이라
 * `useQuery` 가 아닌 `useMutation` 이다 — 쿼리로 두면 캐시 무효화나 창 포커스만
 * 으로도 다시 돌아 알림이 중복 발송될 수 있다.
 *
 * 실패해도 사용자에게 알리지 않는다. 배경에서 도는 동작이라 토스트를 띄우면
 * 지도를 보는 중에 관련 없는 오류가 튀어나온다. 알림이 안 온 것으로 충분하다.
 *
 * ⚠️ 호출부가 **호출 빈도를 직접 관리해야 한다.** 서버가 나무별·하루 1회로
 * 막아 주긴 하지만 그건 발송 기준이고, 요청 자체는 부르는 만큼 나간다.
 * 위치가 바뀔 때마다 부르면 걸어가는 내내 요청이 쏟아진다.
 */
export const useCheckNearbyAlerts = () =>
  useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      checkNearbyAlerts(lat, lng),
    retry: false,
  });

/**
 * 근처 나무 알림 기록 조회 훅. `GET /nearby-alerts/logs`
 *
 * 푸시를 놓쳤을 때 여기서 다시 확인한다.
 *
 * 알림은 앱이 꺼져 있는 동안에도 쌓이므로, 화면에 돌아왔을 때는 다시 받아야
 * 한다. 그래서 `staleTime` 을 짧게 두고 창 포커스 시 갱신을 막지 않는다.
 */
export const useNearbyAlertLogs = ({
  page = 1,
  size = NEARBY_ALERT_PAGE_SIZE,
}: { page?: number; size?: number } = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: nearbyAlertKeys.logs(page, size),
    queryFn: () => getNearbyAlertLogs({ page, size }),
    enabled: Boolean(accessToken),
    staleTime: 1000 * 30,
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
    refetchOnWindowFocus: (query) => !isClientError(query.state.error),
  });
};

/**
 * 알림 확인 처리 훅. `PATCH /nearby-alerts/logs/{alertLogId}/open`
 *
 * 푸시를 눌렀거나 기록 목록에서 내용을 봤을 때 부른다.
 *
 * 낙관적으로 먼저 `OPENED` 로 바꾼다 — 확인 표시는 사용자가 이미 한 행동의
 * 결과라, 응답을 기다리는 동안 안 읽음으로 남아 있으면 눌리지 않은 것처럼
 * 보인다. 실패하면 되돌린다.
 *
 * 목록이 페이지마다 캐시 키가 달라서 열려 있는 페이지를 전부 훑어 갱신한다.
 *
 * 실패해도 토스트를 띄우지 않는다. "읽음 표시" 가 안 된 것뿐이라 사용자가
 * 할 일이 없고, 다음 조회에서 서버 값으로 맞춰진다.
 */
export const useOpenNearbyAlertLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: openNearbyAlertLog,

    onMutate: async (alertLogId) => {
      await queryClient.cancelQueries({ queryKey: nearbyAlertKeys.all });

      const previous = queryClient.getQueriesData<NearbyAlertLogPage>({
        queryKey: nearbyAlertKeys.all,
      });

      queryClient.setQueriesData<NearbyAlertLogPage>(
        { queryKey: nearbyAlertKeys.all },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.alertLogId === alertLogId
                    ? {
                        ...item,
                        status: 'OPENED' as const,
                        openedAt: item.openedAt ?? new Date().toISOString(),
                      }
                    : item,
                ),
              }
            : old,
      );

      return { previous };
    },

    onError: (_error, _alertLogId, context) => {
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nearbyAlertKeys.all });
    },
  });
};
