export interface PixelCluster<T> {
  /** 클러스터 중심 좌표(구성 마커들의 평균). */
  lat: number;
  lng: number;
  /** 이 클러스터에 묶인 항목들. 길이가 1이면 단일 마커. */
  items: T[];
}

interface Pixel {
  x: number;
  y: number;
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * 화면 좌표만 보고 인덱스를 묶는다(그리디: 앞에서부터 훑으며 아직 안 묶인 것을 끌어모음).
 * 좌표계의 원점은 상관없고 점 사이의 거리만 쓰므로, 줌을 가정해 배율만 곱한 좌표에도 그대로 쓸 수 있다.
 */
function groupByPixelDistance(points: Pixel[], distancePx: number): number[][] {
  const used = new Array(points.length).fill(false);
  const groups: number[][] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const group = [i];

    for (let j = i + 1; j < points.length; j += 1) {
      if (used[j]) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.hypot(dx, dy) < distancePx) {
        used[j] = true;
        group.push(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * 현재 지도 화면(줌 상태) 기준으로 마커를 **화면 픽셀 거리**로 묶는다.
 *
 * 지도 거리(m)가 아니라 픽셀로 재는 게 핵심이다 — 겹쳐 보이는지는 축척이 결정하므로,
 * 줌 아웃할수록 같은 좌표들이 더 많이 뭉친다. 홈 지도(나무)와 동선 보기(순번 마커)가
 * 같은 규칙을 쓰되 임계값만 다르다.
 *
 * 앞에서부터 훑으며 아직 안 묶인 것을 끌어모으는 그리디 방식이다. 결과가 입력 순서에
 * 의존하지만, 순서가 고정된 배열을 넘기면 같은 줌에서 항상 같은 묶음이 나온다.
 */
export function clusterByPixelDistance<T extends { lat: number; lng: number }>(
  map: kakao.maps.Map,
  items: T[],
  distancePx: number,
): PixelCluster<T>[] {
  const projection = map.getProjection();
  const points = items.map((item) => ({
    item,
    point: projection.containerPointFromCoords(new window.kakao.maps.LatLng(item.lat, item.lng)),
  }));

  return groupByPixelDistance(
    points.map((entry) => entry.point),
    distancePx,
  ).map((group) => {
    const grouped = group.map((index) => points[index].item);
    return {
      lat: average(grouped.map((item) => item.lat)),
      lng: average(grouped.map((item) => item.lng)),
      items: grouped,
    };
  });
}

/**
 * 주어진 항목들이 **둘 이상으로 쪼개지는 첫 줌 레벨**을 찾는다.
 * 지금보다 한 단계씩 확대해 보며 가장 덜 확대해도 되는 레벨을 고르고,
 * 최대 줌인(minLevel)까지 가도 안 쪼개지면(좌표가 사실상 겹친 경우) null 을 준다.
 *
 * 지도를 실제로 움직이지 않고 화면 좌표에 배율만 곱해 판정한다 —
 * 카카오맵은 레벨이 한 단계 낮아질 때 축척이 2배가 되므로 점 사이 픽셀 거리도 2배가 된다.
 */
export function findSplitLevel<T extends { lat: number; lng: number }>(
  map: kakao.maps.Map,
  items: T[],
  distancePx: number,
  minLevel: number,
): number | null {
  const projection = map.getProjection();
  const points = items.map((item) =>
    projection.containerPointFromCoords(new window.kakao.maps.LatLng(item.lat, item.lng)),
  );
  const currentLevel = map.getLevel();

  for (let level = currentLevel - 1; level >= minLevel; level -= 1) {
    const scale = 2 ** (currentLevel - level);
    const scaled = points.map((point) => ({ x: point.x * scale, y: point.y * scale }));
    if (groupByPixelDistance(scaled, distancePx).length >= 2) return level;
  }

  return null;
}
