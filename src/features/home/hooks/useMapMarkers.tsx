import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TreeMarker } from '../components/TreeMarker';
import { ClusterMarker } from '../components/ClusterMarker';
import { clusterMarkers, type MarkerCluster } from '../lib/cluster';

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  label: string;
  date: string;
  comment: string;
  photo?: string;
  isFavorite?: boolean;
}

/** content HTMLElement 를 만들고 클릭 핸들러를 붙인 CustomOverlay 를 생성한다. */
function createOverlay(
  map: kakao.maps.Map,
  lat: number,
  lng: number,
  markup: string,
  onClick: () => void,
) {
  const container = document.createElement('div');
  container.innerHTML = markup;
  container.style.cursor = 'pointer';
  container.addEventListener('click', onClick);

  const overlay = new window.kakao.maps.CustomOverlay({
    position: new window.kakao.maps.LatLng(lat, lng),
    content: container,
    yAnchor: 1, // 나무/뱃지 밑동이 좌표에 닿도록
  });
  overlay.setMap(map);
  return overlay;
}

/**
 * 카카오맵 위에 나무 마커를 그리되, 화면상 가까이 붙은 마커는 하나의
 * 클러스터 뱃지로 합쳐 렌더링한다. 줌/이동이 끝날 때(idle)마다 다시 묶는다.
 *
 * content 를 HTMLElement 로 만들어 클릭 이벤트를 직접 붙인다.
 * (renderToStaticMarkup 만으로는 정적 HTML 문자열이라 React 이벤트가 안 붙음)
 */
export function useMapMarkers(
  map: kakao.maps.Map | null,
  markers: MapMarkerData[],
  onMarkerClick: (marker: MapMarkerData) => void,
) {
  useEffect(() => {
    if (!map) return;

    let overlays: kakao.maps.CustomOverlay[] = [];

    const clearOverlays = () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];
    };

    /** 클러스터를 탭하면 그 중심으로 한 단계 확대해 마커를 펼친다. */
    const zoomIntoCluster = (cluster: MarkerCluster) => {
      const anchor = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);
      map.setLevel(Math.max(map.getLevel() - 2, 1), { anchor });
    };

    const render = () => {
      clearOverlays();
      const clusters = clusterMarkers(map, markers);

      overlays = clusters.map((cluster) => {
        if (cluster.items.length === 1) {
          const marker = cluster.items[0];
          return createOverlay(
            map,
            marker.lat,
            marker.lng,
            renderToStaticMarkup(<TreeMarker emoji={marker.emoji} label={marker.label} />),
            () => onMarkerClick(marker),
          );
        }

        return createOverlay(
          map,
          cluster.lat,
          cluster.lng,
          renderToStaticMarkup(<ClusterMarker count={cluster.items.length} />),
          () => zoomIntoCluster(cluster),
        );
      });
    };

    render();
    window.kakao.maps.event.addListener(map, 'idle', render);

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', render);
      clearOverlays();
    };
  }, [map, markers, onMarkerClick]);
}
