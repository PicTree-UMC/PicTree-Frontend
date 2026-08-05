import { useEffect, useMemo, useRef } from 'react';

import { useNearbyTrees } from '@/features/home/hooks/useTrees';
import type { NearbyTreeItem } from '@/features/home/types/tree';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { distanceInMeters } from '../lib/geoDistance';
import {
  DEBOUNCE_MAX_WAIT_MS,
  DEBOUNCE_MS,
  MIN_INTERVAL_MS,
  MIN_MOVE_M,
  buildAlertLabel,
  withinAlertRadius,
} from '../lib/nearbyAlertRule';
import { useMyProfile } from './useMyProfile';
import { useCheckNearbyAlerts } from './useNearbyAlerts';
import { useMyPushSubscriptions } from './usePushSubscription';

export interface NearbyAlert {
  /** 카드에 쓸 이름. 여러 곳이면 "오아시스 만난 곳 외 2곳". */
  label: string;
  /** 가장 가까운 거리(m). 카드의 "약 120m". */
  distanceM: number;
  /** 이 알림에 묶인 나무들. `[보기]` 가 이걸 연다. */
  trees: NearbyTreeItem[];
}

/**
 * 근처 나무 알림 — 위치 감시부터 화면에 띄울 알림까지.
 *
 * ⚠️ **앱이 켜져 있을 때만 동작한다.** 웹은 앱이 꺼진 상태에서 위치를 추적할 수
 * 없다 — 서비스 워커에 `geolocation` 이 없고 Geofencing API 는 브라우저에서
 * 제거됐다. 서버에도 스케줄러가 없어, 프론트가 부르지 않으면 알림은 안 간다.
 *
 * 부르는 조건을 좁게 잡는다. 서버가 나무별·하루 1회로 발송을 막아 주긴 하지만
 * 그건 발송 기준이고 요청 자체는 부르는 만큼 나간다.
 * 1. 알림이 실제로 켜져 있을 때만 (플래그 + 활성 구독)
 * 2. 탭이 보일 때만 — 숨은 탭에서 도는 건 배터리 낭비다
 * 3. 좌표가 디바운스로 잠잠해진 뒤 (`maxWait` 이 있어 걷는 중에도 터진다)
 * 4. 마지막 확인 지점에서 25m 이상 움직였고, 30초는 지났을 때
 *
 * 반환하는 `alert` 는 **반경 50m 안에 든 나무들을 하나로 묶은 것**이다.
 * 여러 곳이 동시에 들어와도 알림은 하나다.
 */
export const useNearbyAlertWatcher = (coords: GeoCoords | null): NearbyAlert | null => {
  const { data: profile } = useMyProfile();
  const { isEnabled: hasPushSubscription } = useMyPushSubscriptions();
  const { mutate: check } = useCheckNearbyAlerts();

  const isAlarmOn = (profile?.notification ?? false) && hasPushSubscription;

  /*
   * 좌표를 그대로 쓰면 GPS 가 1초마다 주는 미세 변화에 매번 반응한다.
   * 디바운스로 잠잠해진 값만 본다 — maxWait 덕에 걷는 동안에도 15초마다는 갱신된다.
   */
  const settledCoords = useDebouncedValue(coords, DEBOUNCE_MS, DEBOUNCE_MAX_WAIT_MS);

  /** 마지막으로 서버에 물어본 지점과 시각. 판정에만 쓰므로 ref 로 둔다. */
  const lastCheck = useRef<{ coords: GeoCoords; at: number } | null>(null);

  useEffect(() => {
    if (!isAlarmOn || !settledCoords) return;
    if (document.visibilityState !== 'visible') return;

    const last = lastCheck.current;

    // 충분히 움직이지 않았으면 물어볼 이유가 없다 — 답이 같다.
    if (last && distanceInMeters(last.coords, settledCoords) < MIN_MOVE_M) return;

    const fire = () => {
      // 응답을 기다리지 않고 먼저 기록한다 — 실패해도 곧바로 다시 부르지 않는다.
      lastCheck.current = { coords: settledCoords, at: Date.now() };
      check({ lat: settledCoords.latitude, lng: settledCoords.longitude });
    };

    const elapsed = last ? Date.now() - last.at : MIN_INTERVAL_MS;

    if (elapsed >= MIN_INTERVAL_MS) {
      fire();
      return;
    }

    /*
     * 최소 간격에 걸렸으면 **남은 시간만큼 기다렸다가 부른다.**
     *
     * ⚠️ 여기서 그냥 return 하면 안 된다. 걷다가 멈추면 좌표가 더는 안 바뀌어
     * 이 effect 가 다시 돌지 않고, 간격이 지나도 영영 안 물어보게 된다.
     * (실제로 그 버그가 있었다 — 60m 를 움직였는데 호출이 0회였다)
     */
    const timer = setTimeout(fire, MIN_INTERVAL_MS - elapsed);
    return () => clearTimeout(timer);
  }, [settledCoords, isAlarmOn, check]);

  /** 알림을 껐다 켜면 그 자리에서 다시 확인할 수 있게 기준점을 지운다. */
  useEffect(() => {
    if (!isAlarmOn) lastCheck.current = null;
  }, [isAlarmOn]);

  /*
   * 화면에 띄울 알림. `check` 가 푸시를 쏘는 것과 별개로, 앱을 보고 있는 동안은
   * 지도 위 카드로도 알려준다.
   */
  const { data: nearbyTrees } = useNearbyTrees(
    isAlarmOn && settledCoords
      ? { lat: settledCoords.latitude, lng: settledCoords.longitude }
      : null,
  );

  return useMemo(() => {
    const inRange = withinAlertRadius(nearbyTrees);
    if (inRange.length === 0) return null;

    return {
      label: buildAlertLabel(inRange),
      distanceM: inRange[0].distanceM,
      trees: inRange,
    };
  }, [nearbyTrees]);
};
