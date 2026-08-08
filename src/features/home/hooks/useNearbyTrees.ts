import { useMemo } from 'react';

import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import {
  DEBOUNCE_MAX_WAIT_MS,
  DEBOUNCE_MS,
  buildNearbyLabel,
  findNearbyTrees,
  type TreeInRange,
} from '../lib/nearbyTreeRule';
import { useTrees } from './useTrees';

export interface NearbyTrees {
  /** 카드에 쓸 이름. 여러 곳이면 "저장된 기록 3개". */
  label: string;
  /** 가장 가까운 거리(m). 카드의 "약 32m". */
  distanceM: number;
  /** 반경 안에 든 나무들. `[보기]` 가 이걸 연다. */
  trees: TreeInRange[];
}

/**
 * 지금 서 있는 자리 반경 50m 안의 내 나무. 홈 상단 배너가 이걸로 문구를 바꾼다.
 *
 * **요청을 하나도 안 쓴다.** 지도가 마커를 찍느라 이미 받아 둔 목록(`useTrees`)에
 * 대고 거리만 다시 잰다.
 *
 * ⚠️ **앱이 켜져 있을 때만 동작한다.** 웹은 앱이 꺼진 상태에서 위치를 추적할 수
 * 없다 — 서비스 워커에 `geolocation` 이 없고 Geofencing API 는 브라우저에서 제거됐다.
 * 웹 푸시로 이 한계를 넘어 보려던 구조(`POST /nearby-alerts/check` + VAPID 구독)가
 * 있었지만, 결국 **탭이 살아 있어야 요청이 나가는** 것이라 앱을 끄면 똑같이 아무것도
 * 오지 않았다. 알림 권한만 받고 기대는 못 채우는 셈이라 통째로 걷어냈다.
 *
 * 재는 좌표는 원본이 아니라 디바운스된 값이다. 원본은 1초 남짓마다 들어와 GPS 가
 * 떨릴 때마다 "약 32m" 가 흔들린다 — 계산이 공짜여도 읽는 사람은 그렇지 않다.
 *
 * 여러 곳이 동시에 반경에 들어와도 배너는 하나다(가장 가까운 거리 + 묶은 이름).
 */
export const useNearbyTrees = (coords: GeoCoords | null): NearbyTrees | null => {
  const settledCoords = useDebouncedValue(coords, DEBOUNCE_MS, DEBOUNCE_MAX_WAIT_MS);
  const { data: trees } = useTrees();

  return useMemo(() => {
    const inRange = findNearbyTrees(settledCoords, trees);
    if (inRange.length === 0) return null;

    return {
      label: buildNearbyLabel(inRange),
      distanceM: inRange[0].distanceM,
      trees: inRange,
    };
  }, [trees, settledCoords]);
};
