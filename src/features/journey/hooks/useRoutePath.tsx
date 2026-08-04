import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clusterByPixelDistance } from '@/shared/lib/markerCluster';
import { ClusterMarker } from '@/shared/components';
import { RoutePlace } from '../types/route';
import { NumberedMarker } from '../components/NumberedMarker';

/**
 * 이 화면 픽셀 거리 안에 들어온 마커는 하나로 묶는다(화면설계서 9번).
 *
 * **지도 거리(m)가 아니라 화면 px 이다** — 겹쳐 보이는지는 축척이 정하기 때문이고,
 * 날짜가 달라도 화면에서 붙어 있으면 묶는다.
 *
 * **값이 순번 마커 지름과 같은 36 인 건 우연이 아니다** — 마커가 36×36 이라, 중심 거리가
 * 36 미만이면 두 원이 실제로 겹친다는 뜻이다. 즉 "겹치기 시작하면 묶는다"가 규칙이다.
 * **마커 크기를 바꾸면 이 값도 같이 바꿔야 한다** — 안 그러면 겹쳐 놓고도 안 묶이거나(작을 때),
 * 멀쩡히 떨어진 것까지 묶인다(클 때). (`NumberedMarker` 40 → 36 과 함께 내렸다.)
 *
 * ⚠️ 묶음 뱃지는 48 로 마커(36)보다 크다 — 마커가 작아지면서 차이가 12px 로 벌어졌고, 기준도
 * 같이 조여졌으니 뱃지가 **안 묶인 옆 마커를 덮는** 장면을 실기기에서 확인할 것. 과하면 아래
 * localStorage 로 40~44 를 시험해 보고 정한다. (뱃지 쪽 크기는 홈 지도와 공유하는
 * `shared/components/ClusterMarker` 라 여기서 혼자 못 줄인다.)
 *
 * 개발 중에는 코드를 고치지 않고 콘솔에서 바로 바꿔볼 수 있다
 * (지도를 살짝 움직이면 그 값으로 다시 묶인다):
 *
 * ```js
 * localStorage.setItem('pictree.routeClusterPx', '44'); // 되돌리려면 removeItem
 * ```
 */
const CLUSTER_DISTANCE_PX = 36;

function readClusterDistance(): number {
  if (!import.meta.env.DEV) return CLUSTER_DISTANCE_PX;

  const raw = Number(localStorage.getItem('pictree.routeClusterPx'));
  return Number.isFinite(raw) && raw > 0 ? raw : CLUSTER_DISTANCE_PX;
}

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
    const numbered = points
      .filter((point) => !disabledIds.has(point.id))
      .map((point) => {
        sequence += 1;
        return { ...point, sequence };
      });

    const disabled = points.filter((point) => disabledIds.has(point.id));

    let overlays: kakao.maps.CustomOverlay[] = [];

    const addOverlay = (lat: number, lng: number, markup: string, zIndex: number) => {
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content: markup,
        yAnchor: 0.5,
        zIndex,
      });
      overlay.setMap(map);
      overlays.push(overlay);
    };

    /**
     * 줌이 바뀌면 화면상 거리가 달라져 묶임도 달라진다 → 그때마다 다시 그린다.
     * 이동(pan)만으로는 상대 거리가 변하지 않지만, 카카오는 둘을 `idle` 하나로 알려준다.
     */
    const render = () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];

      // 꺼진 장소는 묶지 않는다 — 동선에서 빠진 것들이라 묶음 개수에 섞이면 숫자가 거짓말이 된다.
      disabled.forEach((point) => {
        addOverlay(point.lat, point.lng, renderToStaticMarkup(<NumberedMarker index={null} />), 0);
      });

      clusterByPixelDistance(map, numbered, readClusterDistance()).forEach((cluster) => {
        const markup =
          cluster.items.length === 1 ? (
            <NumberedMarker index={cluster.items[0].sequence} />
          ) : (
            <ClusterMarker count={cluster.items.length} />
          );

        // 묶음 뱃지는 개별 마커보다 위에 둔다 — 겹칠 만큼 가까우니 아래 깔리면 안 보인다.
        addOverlay(
          cluster.lat,
          cluster.lng,
          renderToStaticMarkup(markup),
          cluster.items.length === 1 ? 1 : 2,
        );
      });
    };

    render();
    window.kakao.maps.event.addListener(map, 'idle', render);

    const byDate = new Map<string, RoutePlace[]>();
    numbered.forEach((point) => {
      const group = byDate.get(point.date) ?? [];
      group.push(point);
      byDate.set(point.date, group);
    });

    // 선은 묶음과 무관하게 원래 좌표를 잇는다 — 묶인 중심으로 당기면 경로 모양이 바뀐다.
    const polylines = [...byDate.values()]
      .filter((group) => group.length > 1)
      .map((group) => {
        const polyline = new window.kakao.maps.Polyline({
          path: group.map((point) => new window.kakao.maps.LatLng(point.lat, point.lng)),
          strokeWeight: 4,
          /*
            BARK(줄기 갈색). 팔레트에 순수 검정이 없어서(아이콘의 #111 조차 INK 로 흡수됐다)
            바꿔야 했고, 마커가 GREEN-500 이 되면서 선도 초록이면 둘이 한 덩어리로 뭉갠다.

            나무를 잇는 선이라 줄기 색을 쓴다. 값은 눈대중이 아니라 **GREEN-700(L*43)과 같은
            밝기 단**으로 맞춘 것(L*41) — 초록 옆에 놓아도 한쪽만 튀지 않는다.
            docs/design-guidelines.md 의 BARK 항목과 같은 값이다.
          */
          strokeColor: '#7A5C3A',
          strokeOpacity: 0.9,
          strokeStyle: 'shortdash',
        });
        polyline.setMap(map);
        return polyline;
      });

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', render);
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
