import type { NearbyTreeItem } from '@/features/home/types/tree';

/**
 * 알림이 울리는 반경(m).
 *
 * ⚠️ 서버는 100m(`NEARBY_TREE_RADIUS_M`)로 찾아서 준다. 50m 는 **프론트에서 좁힌
 * 값**이다 — 응답에 `distanceM` 이 있어 서버 수정 없이 거를 수 있다.
 *
 * 서버가 50m 로 바뀌면 이 필터는 아무것도 걸러내지 않게 되므로 그대로 둬도 안전하다.
 */
export const ALERT_RADIUS_M = 50;

/**
 * 다시 확인하기까지 움직여야 하는 거리(m).
 *
 * 반경의 절반이다. 알림 구역의 지름이 100m 라, 25m 마다 물어보면 구역을 가로질러
 * 지나가도 안쪽에서 최소 몇 번은 찍힌다. 더 짧게 잡으면 GPS 가 제자리에서 흔들리는
 * 것만으로도 요청이 나간다(앱이 보는 정확도 경계가 30m 다).
 */
export const MIN_MOVE_M = 25;

/**
 * 아무리 움직여도 이 간격보다 자주는 안 부른다(ms).
 *
 * 걸어서 100m 구역을 통과하는 데 약 70초라 30초면 안쪽에서 두 번은 찍힌다.
 * 자전거·차로는 그 전에 지나가지만, 근처 나무 알림은 걷는 상황을 전제한 기능이다.
 */
export const MIN_INTERVAL_MS = 30_000;

/** 좌표가 잠잠해졌다고 보는 시간(ms). GPS 미세 떨림을 흡수한다. */
export const DEBOUNCE_MS = 3_000;

/**
 * 계속 움직여도 이 간격마다는 좌표를 반영한다(ms).
 *
 * ⚠️ 이게 없으면 걷는 동안 디바운스가 영영 안 터진다 — `watchPosition` 이
 * 1초 남짓마다 새 좌표를 주기 때문이다.
 */
export const DEBOUNCE_MAX_WAIT_MS = 15_000;

/** 알림 반경 안에 든 나무만 남긴다. 가까운 순서는 서버가 이미 정렬해 준다. */
export const withinAlertRadius = (trees: NearbyTreeItem[] | undefined): NearbyTreeItem[] =>
  (trees ?? []).filter((tree) => tree.distanceM <= ALERT_RADIUS_M);

/**
 * 알림 문구에 쓸 이름. **지도 마커와 같은 규칙이다.**
 *
 * 지도에서 나무가 겹치면 클러스터 마커 하나로 뭉쳐 개수를 보여 주는데, 알림도
 * 같게 읽히도록 맞췄다.
 *
 * - 반경에 한 곳뿐이면 → 그 장소 이름 (`"오아시스 만난 곳"`)
 * - 여러 곳이면 → 개수로 (`"저장된 기록 3개"`)
 *
 * 여러 곳이어도 **알림은 하나**다. 이름을 다 나열하면 카드가 넘치고, 알림을
 * 여러 개 띄우면 산책 한 번에 알림이 쏟아진다.
 */
export const buildAlertLabel = (trees: NearbyTreeItem[]): string => {
  if (trees.length === 0) return '';

  return trees.length === 1 ? trees[0].name : `저장된 기록 ${trees.length}개`;
};
