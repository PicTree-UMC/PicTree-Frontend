import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import { CurrentLocationMarker } from '../components/CurrentLocationMarker';

/**
 * 현재 위치 좌표를 받아 지도에 파란 점 오버레이로 표시한다.
 * (지도 초기 중심은 useKakaoMap 이 내 위치로 열므로 여기선 표시만 담당)
 *
 * 지도를 따라 움직이지는 않는다 — 점만 옮긴다. 좌표가 올 때마다 지도를 옮기면
 * 사용자가 다른 곳을 보고 있을 때 화면이 제멋대로 끌려간다.
 */
export function useCurrentLocation(map: kakao.maps.Map | null, coords: GeoCoords | null) {
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

  /*
   * 오버레이는 지도당 한 번만 만들고 위치만 갈아끼운다.
   * 좌표마다 새로 만들어 붙이면 추적 모드에서 초 단위로 DOM 이 교체되며 점이 깜빡인다.
   */
  useEffect(() => {
    if (!map) return;

    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(<CurrentLocationMarker />);
    /*
     * 위치 점은 순수 표시용이라 클릭을 받을 이유가 없다. 그런데 zIndex 가 나무/클러스터
     * 마커보다 높아, 그냥 두면 겹친 자리에서 아래 마커의 클릭을 가로채 탭이 안 먹는다.
     * (맥동 링은 transform 으로 커져 히트 영역이 더 넓어지므로 증상이 산발적으로 보인다)
     */
    container.style.pointerEvents = 'none';
    const overlay = new window.kakao.maps.CustomOverlay({
      // 첫 좌표가 오기 전에는 지도에 붙이지 않으므로 초기 위치는 의미가 없다.
      position: new window.kakao.maps.LatLng(0, 0),
      content: container,
      zIndex: 5,
    });
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!map || !overlay || !coords) return;

    overlay.setPosition(new window.kakao.maps.LatLng(coords.latitude, coords.longitude));
    overlay.setMap(map);
  }, [map, coords]);
}
