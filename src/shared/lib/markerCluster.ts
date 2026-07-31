export interface PixelCluster<T> {
  /** 클러스터 중심 좌표(구성 마커들의 평균). */
  lat: number;
  lng: number;
  /** 이 클러스터에 묶인 항목들. 길이가 1이면 단일 마커. */
  items: T[];
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

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

  const used = new Array(points.length).fill(false);
  const clusters: PixelCluster<T>[] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const group = [points[i]];

    for (let j = i + 1; j < points.length; j += 1) {
      if (used[j]) continue;
      const dx = points[i].point.x - points[j].point.x;
      const dy = points[i].point.y - points[j].point.y;
      if (Math.hypot(dx, dy) < distancePx) {
        used[j] = true;
        group.push(points[j]);
      }
    }

    const grouped = group.map((entry) => entry.item);
    clusters.push({
      lat: average(grouped.map((item) => item.lat)),
      lng: average(grouped.map((item) => item.lng)),
      items: grouped,
    });
  }

  return clusters;
}
