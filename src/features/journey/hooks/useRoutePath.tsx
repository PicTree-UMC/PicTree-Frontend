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
 *
 * `disabledIds` 의 장소는 번호와 선에서 빠지고 빈 원으로만 남는다(설계서 7번).
 */
export function useRoutePath(
  map: kakao.maps.Map | null,
  points: RoutePlace[],
  disabledIds: ReadonlySet<number>,
) {
  useEffect(() => {
    if (!map) return;

    // 번호는 켜진 장소에만 매긴다. 2번을 끄면 3번이 2번이 되는 재순서화가 여기서 나온다.
    let sequence = 0;
    const overlays = points.map((point) => {
      const active = !disabledIds.has(point.id);
      if (active) sequence += 1;

      const content = renderToStaticMarkup(<NumberedMarker index={active ? sequence : null} />);
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content,
        yAnchor: 0.5,
        // 꺼진 마커가 켜진 마커를 가리지 않게 한 층 아래로 내린다.
        zIndex: active ? 1 : 0,
      });
      overlay.setMap(map);
      return overlay;
    });

    const byDate = new Map<string, RoutePlace[]>();
    points
      .filter((point) => !disabledIds.has(point.id))
      .forEach((point) => {
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

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, points, disabledIds]);

  // 고른 날짜가 서로 멀리 떨어져 있으면 기본 중심에선 화면 밖으로 나간다 → 전부 담기게 맞춘다.
  // **장소를 껐다 켤 때는 다시 맞추지 않는다** — 칩 하나 누를 때마다 지도가 튀면 어디를 봤는지
  // 잃어버린다. 그래서 마커 효과와 분리해 날짜(points)에만 반응시킨다.
  useEffect(() => {
    if (!map || points.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)));
    map.setBounds(bounds);
  }, [map, points]);
}
