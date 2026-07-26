import type { MapMarkerData } from '../hooks/useMapMarkers';

export interface MarkerCluster {
  /** 클러스터 중심 좌표(구성 마커들의 평균). */
  lat: number;
  lng: number;
  /** 이 클러스터에 묶인 마커들. 길이가 1이면 단일 마커. */
  items: MapMarkerData[];
}

/** 이 픽셀 거리 안에 들어오면 같은 클러스터로 묶는다. */
const CLUSTER_DISTANCE_PX = 60;

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * 현재 지도 화면(줌/이동 상태) 기준으로 마커들을 픽셀 거리로 그룹핑한다.
 * 화면상 가까운 마커끼리 하나의 클러스터로 묶여, 줌 아웃할수록 더 많이 뭉친다.
 */
export function clusterMarkers(
  map: kakao.maps.Map,
  markers: MapMarkerData[],
): MarkerCluster[] {
  const projection = map.getProjection();
  const points = markers.map((marker) => ({
    marker,
    point: projection.containerPointFromCoords(
      new window.kakao.maps.LatLng(marker.lat, marker.lng),
    ),
  }));

  const used = new Array(points.length).fill(false);
  const clusters: MarkerCluster[] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const group = [points[i]];

    for (let j = i + 1; j < points.length; j += 1) {
      if (used[j]) continue;
      const dx = points[i].point.x - points[j].point.x;
      const dy = points[i].point.y - points[j].point.y;
      if (Math.hypot(dx, dy) < CLUSTER_DISTANCE_PX) {
        used[j] = true;
        group.push(points[j]);
      }
    }

    const items = group.map((entry) => entry.marker);
    clusters.push({
      lat: average(items.map((item) => item.lat)),
      lng: average(items.map((item) => item.lng)),
      items,
    });
  }

  return clusters;
}
