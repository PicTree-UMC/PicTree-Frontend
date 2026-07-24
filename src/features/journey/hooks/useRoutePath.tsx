import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoutePlace } from '../types/route';
import { NumberedMarker } from '../components/NumberedMarker';

/** 지도 위에 순번 마커를 찍고 점선 폴리라인으로 잇는다. points 순서가 곧 경로 순서. */
export function useRoutePath(map: kakao.maps.Map | null, points: RoutePlace[]) {
  useEffect(() => {
    if (!map) return;

    const overlays = points.map((point, index) => {
      const content = renderToStaticMarkup(<NumberedMarker index={index + 1} />);
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content,
        yAnchor: 0.5,
      });
      overlay.setMap(map);
      return overlay;
    });

    const polyline =
      points.length > 1
        ? new window.kakao.maps.Polyline({
            path: points.map((point) => new window.kakao.maps.LatLng(point.lat, point.lng)),
            strokeWeight: 4,
            strokeColor: '#000000',
            strokeOpacity: 0.9,
            strokeStyle: 'shortdash',
          })
        : null;
    polyline?.setMap(map);

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      polyline?.setMap(null);
    };
  }, [map, points]);
}
