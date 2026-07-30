import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoutePlace } from '../types/route';
import { NumberedMarker } from '../components/NumberedMarker';

/**
 * 지도 위에 순번 마커를 찍고 점선 폴리라인으로 잇는다. points 순서가 곧 경로 순서.
 *
 * **선은 날짜별로 끊는다**(화면설계서 5번) — 3월 31일 마지막 장소와 4월 1일 첫 장소를
 * 이어버리면 하루 만에 이동한 것처럼 보인다. 반면 마커 번호는 날짜를 넘어 계속 이어진다
 * (설계서의 예: 1·2번 3월 31일, 3·4번 4월 1일, 5번 4월 3일).
 */
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

    const byDate = new Map<string, RoutePlace[]>();
    points.forEach((point) => {
      const group = byDate.get(point.date) ?? [];
      group.push(point);
      byDate.set(point.date, group);
    });

    const polylines = [...byDate.values()]
      .filter((group) => group.length > 1)
      .map((group) => {
        const polyline = new window.kakao.maps.Polyline({
          path: group.map((point) => new window.kakao.maps.LatLng(point.lat, point.lng)),
          strokeWeight: 4,
          strokeColor: '#000000',
          strokeOpacity: 0.9,
          strokeStyle: 'shortdash',
        });
        polyline.setMap(map);
        return polyline;
      });

    // 고른 날짜가 서로 멀리 떨어져 있으면 기본 중심에선 화면 밖으로 나간다 → 전부 담기게 맞춘다.
    if (points.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      points.forEach((point) => bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)));
      map.setBounds(bounds);
    }

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, points]);
}
