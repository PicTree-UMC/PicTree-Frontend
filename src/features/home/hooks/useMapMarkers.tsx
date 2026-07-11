import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TreeMarker } from '../components/TreeMarker';

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  label: string;
  date: string;
  comment: string;
  isFavorite?: boolean;
}

/**
 * 카카오맵 위에 CustomOverlay 로 나무 마커(+말풍선 라벨)를 렌더링.
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

    const overlays = markers.map((marker) => {
      const container = document.createElement('div');
      container.innerHTML = renderToStaticMarkup(
        <TreeMarker emoji={marker.emoji} label={marker.label} />,
      );
      container.style.cursor = 'pointer';
      container.addEventListener('click', () => onMarkerClick(marker));

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        content: container,
        yAnchor: 1, // 나무 밑동이 좌표에 정확히 닿도록
      });
      overlay.setMap(map);
      return overlay;
    });

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [map, markers, onMarkerClick]);
}
