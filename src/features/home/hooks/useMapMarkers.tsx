import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkerLabel, MarkerLabelProps } from '../components/MarkerLabel';

export interface MapMarkerData {
  lat: number;
  lng: number;
  label: MarkerLabelProps;
}

/** 카카오맵 위에 CustomOverlay 로 마커 라벨을 렌더링. map 이 준비된 뒤에만 동작. */
export function useMapMarkers(map: kakao.maps.Map | null, markers: MapMarkerData[]) {
  useEffect(() => {
    if (!map) return;

    const overlays = markers.map(({ lat, lng, label }) => {
      const content = renderToStaticMarkup(<MarkerLabel {...label} />);
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content,
        yAnchor: 1.2,
      });
      overlay.setMap(map);
      return overlay;
    });

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [map, markers]);
}
