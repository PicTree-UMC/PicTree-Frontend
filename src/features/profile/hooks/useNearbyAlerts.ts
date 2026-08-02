import { useMutation } from '@tanstack/react-query';

import { checkNearbyAlerts } from '../api/nearbyAlertApi';

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
