import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import type { MapMarkerData } from '../hooks/useMapMarkers';
import { distanceInMeters } from './geoDistance';

/**
 * 상단 배너가 "근처에 있다" 고 말하는 반경(m).
 *
 * 한때 서버가 100m 로 찾아 준 목록을 프론트가 50m 로 좁히는 구조였다. 지금은 지도
 * 목록에서 직접 재므로 이 값 하나가 기준의 전부다.
 */
export const NEARBY_RADIUS_M = 50;

/** 좌표가 잠잠해졌다고 보는 시간(ms). GPS 미세 떨림을 흡수한다. */
export const DEBOUNCE_MS = 3_000;

/**
 * 계속 움직여도 이 간격마다는 좌표를 반영한다(ms).
 *
 * ⚠️ 이게 없으면 걷는 동안 디바운스가 영영 안 터진다 — `watchPosition` 이
 * 1초 남짓마다 새 좌표를 주기 때문이다.
 */
export const DEBOUNCE_MAX_WAIT_MS = 15_000;

/** 반경 안에 든 나무 한 그루. 지도 마커에 잰 거리를 얹은 것이다. */
export interface TreeInRange {
  /** 마커 id — `보기` 가 이걸로 상세를 연다. */
  id: string;
  name: string;
  /** 현재 위치로부터의 거리(m). */
  distanceM: number;
}

/**
 * 반경 안에 든 나무를 가까운 순으로 추린다.
 *
 * **지도가 이미 받아 둔 목록에서 직접 잰다.** 예전에는 좌표가 갱신될 때마다
 * `GET /trees/nearby` 를 불렀는데, 좌표까지 들어 있는 같은 나무를 두 번 받아 오던
 * 셈이었다. Haversine 과 서버 `ST_Distance_Sphere` 의 차이는 이 거리에서 1m 미만이라
 * 판정이 달라지지 않는다.
 *
 * 그 API 에 남의 나무가 섞여 오던 문제(서버 쿼리에 `userId` 조건 없음)도 이걸로
 * 사라졌다 — 이 목록은 처음부터 내 것뿐이다.
 *
 * ⚠️ **지도 목록은 100개까지다**(`MAP_PAGE_SIZE`). 나무가 그보다 많으면 뒤쪽은
 * 배너에 안 잡힌다. 지도 마커도 같은 100개라 화면상 새로 생긴 제약은 아니다.
 */
export const findNearbyTrees = (
  coords: GeoCoords | null,
  trees: MapMarkerData[] | undefined,
): TreeInRange[] =>
  coords
    ? (trees ?? [])
        .map((tree) => ({
          id: tree.id,
          name: tree.label,
          distanceM: distanceInMeters(coords, {
            latitude: tree.lat,
            longitude: tree.lng,
          }),
        }))
        .filter((tree) => tree.distanceM <= NEARBY_RADIUS_M)
        .sort((a, b) => a.distanceM - b.distanceM)
    : [];

/**
 * 배너 문구에 쓸 이름. **지도 마커와 같은 규칙이다.**
 *
 * 지도에서 나무가 겹치면 클러스터 마커 하나로 뭉쳐 개수를 보여 주는데, 배너도
 * 같게 읽히도록 맞췄다.
 *
 * - 반경에 한 곳뿐이면 → 그 장소 이름 (`"오아시스 만난 곳"`)
 * - 여러 곳이면 → 개수로 (`"저장된 기록 3개"`)
 *
 * 이름을 다 나열하면 카드가 넘친다.
 */
export const buildNearbyLabel = (trees: TreeInRange[]): string => {
  if (trees.length === 0) return '';

  return trees.length === 1 ? trees[0].name : `저장된 기록 ${trees.length}개`;
};
