import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import { CurrentLocationMarker } from '../components/CurrentLocationMarker';

/**
 * 현재 위치 좌표를 받아 지도에 파란 점 오버레이로 표시한다.
 * (지도 초기 중심은 useKakaoMap 이 내 위치로 열므로 여기선 표시만 담당)
 */
export function useCurrentLocation(map: kakao.maps.Map | null, coords: GeoCoords | null) {
  useEffect(() => {
    if (!map || !coords) return;

    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(<CurrentLocationMarker />);
    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(coords.latitude, coords.longitude),
      content: container,
      zIndex: 5,
    });
    overlay.setMap(map);

    return () => overlay.setMap(null);
  }, [map, coords]);
}
