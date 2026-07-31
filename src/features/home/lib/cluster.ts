import { clusterByPixelDistance, type PixelCluster } from '@/shared/lib/markerCluster';
import type { MapMarkerData } from '../hooks/useMapMarkers';

export type MarkerCluster = PixelCluster<MapMarkerData>;

/** 이 픽셀 거리 안에 들어오면 같은 클러스터로 묶는다. */
const CLUSTER_DISTANCE_PX = 60;

/**
 * 현재 지도 화면(줌/이동 상태) 기준으로 나무 마커들을 픽셀 거리로 그룹핑한다.
 *
 * 묶는 규칙 자체는 동선 보기 화면과 공유한다(`shared/lib/markerCluster`).
 * 여기 남는 건 홈 지도의 임계값뿐이다 — 동선 보기는 마커가 더 작아 42px 를 쓴다.
 */
export function clusterMarkers(map: kakao.maps.Map, markers: MapMarkerData[]): MarkerCluster[] {
  return clusterByPixelDistance(map, markers, CLUSTER_DISTANCE_PX);
}
