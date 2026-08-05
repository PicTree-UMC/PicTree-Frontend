import { useEffect, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clusterByPixelDistance, findSplitLevel } from '@/shared/lib/markerCluster';
import { ClusterMarker } from '@/shared/components';
import { MIN_ZOOM_LEVEL } from '../../home/hooks/useKakaoMap';
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
 *
 * `dateFilter` 가 걸리면 **그 날짜만 그린다.** 시트 목록과 같은 범위를 보게 하려는 것이다 —
 * 목록은 하루로 좁혔는데 지도는 사흘치가 그대로 깔려 있으면, 지금 보고 있는 게 어느 날의
 * 동선인지 지도에서 되짚을 수가 없다.
 */
export function useRoutePath(
  map: kakao.maps.Map | null,
  points: RoutePlace[],
  disabledIds: ReadonlySet<number>,
  /** 그릴 날짜. `null` 이면 전부. **거르기지 빼기가 아니다** — 저장에는 영향이 없다. */
  dateFilter: string | null,
  /**
   * 최대 줌인까지 확대해도 안 쪼개지는 묶음을 탭했을 때. 겹쳐 있는 장소 id 들을 넘긴다.
   * 지도에서는 더 보여줄 게 없으니 화면 쪽(하단 시트)이 대신 짚어주라는 신호다.
   */
  onOverlappingTap?: (placeIds: number[]) => void,
) {
  /*
    콜백을 ref 에 담아 쓴다. 아래 effect 의 의존성에 넣으면 부모가 매 렌더 새 함수를
    넘길 때마다 마커를 전부 지웠다 다시 그리게 된다(등장 애니메이션까지 다시 탄다).
    탭 시점에 최신 콜백만 있으면 되므로 ref 로 충분하다.
  */
  const onOverlappingTapRef = useRef(onOverlappingTap);
  useEffect(() => {
    onOverlappingTapRef.current = onOverlappingTap;
  }, [onOverlappingTap]);

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

    /*
      ⚠️ **번호를 매긴 뒤에 거른다.** 걸러진 장소만 모아 다시 세면 지도가 1부터 다시 시작해
      시트 목록의 번호와 어긋난다 — 시트도 같은 순서로 센 다음 안 보일 줄만 빼고 그린다.
      4월 1일만 보고 있어도 그날 첫 장소는 3번이면 3번 그대로여야 한다.
    */
    const isShown = (point: RoutePlace) => dateFilter === null || point.date === dateFilter;
    const shown = numbered.filter(isShown);
    const disabled = points.filter((point) => disabledIds.has(point.id) && isShown(point));

    let overlays: kakao.maps.CustomOverlay[] = [];

    /**
     * `onClick` 이 있으면 content 를 **문자열이 아니라 HTMLElement 로** 만든다 —
     * `renderToStaticMarkup` 결과는 정적 HTML 이라 React 이벤트가 안 붙어서, 직접 만든
     * element 에 리스너를 건다(홈 지도 `useMapMarkers` 와 같은 방식).
     * 리스너는 element 와 함께 사라지므로 따로 떼지 않는다 — 다시 그릴 때 오버레이째 버린다.
     */
    const addOverlay = (
      lat: number,
      lng: number,
      markup: string,
      zIndex: number,
      onClick?: () => void,
    ) => {
      let content: string | HTMLElement = markup;

      if (onClick) {
        const container = document.createElement('div');
        container.innerHTML = markup;
        container.style.cursor = 'pointer';
        container.addEventListener('click', onClick);
        content = container;
      }

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content,
        yAnchor: 0.5,
        zIndex,
      });
      overlay.setMap(map);
      overlays.push(overlay);
    };

    /**
     * 묶음 뱃지 탭 → **쪼개지는 레벨까지 한 번에 확대**(홈 지도와 같은 규칙).
     *
     * 한 단계씩 찔러보지 않는 이유: 한 번 눌러도 그대로 뭉쳐 있으면 몇 번을 눌러야 풀리는지
     * 알 수 없다. 지도를 실제로 움직이지 않고 배율만 곱해 미리 판정한 뒤 그 레벨로 간다.
     * `anchor` 로 묶음 중심을 고정해 그 지점을 향해 확대된다.
     *
     * ⚠️ 최대 줌인까지 가도 안 쪼개지면(좌표가 사실상 겹친 경우) **줌을 건드리지 않는다** —
     * 확대해봐야 겹친 그대로다. 대신 `onOverlappingTap` 으로 넘겨 하단 시트가 그 장소들을
     * 짚게 한다. 홈 지도는 이 자리에서 상세 뷰어를 열지만 이 화면엔 뷰어가 없고, 겹친
     * 장소들은 시트 목록에 번호대로 이미 다 있어서 거기로 데려다주는 게 맞다.
     */
    const zoomIntoCluster = (cluster: { lat: number; lng: number; items: RoutePlace[] }) => {
      const splitLevel = findSplitLevel(map, cluster.items, readClusterDistance(), MIN_ZOOM_LEVEL);
      if (splitLevel === null) {
        onOverlappingTapRef.current?.(cluster.items.map((place) => place.id));
        return;
      }

      map.setLevel(splitLevel, {
        anchor: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
        animate: true, // 즉시 점프 대신 부드럽게 확대
      });
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

      clusterByPixelDistance(map, shown, readClusterDistance()).forEach((cluster) => {
        const isCluster = cluster.items.length > 1;
        const markup = isCluster ? (
          <ClusterMarker count={cluster.items.length} />
        ) : (
          <NumberedMarker index={cluster.items[0].sequence} />
        );

        // 묶음 뱃지는 개별 마커보다 위에 둔다 — 겹칠 만큼 가까우니 아래 깔리면 안 보인다.
        // 클릭은 묶음에만 붙는다: 순번 마커는 눌러서 할 일이 없다(끄고 켜는 건 시트 몫).
        addOverlay(
          cluster.lat,
          cluster.lng,
          renderToStaticMarkup(markup),
          isCluster ? 2 : 1,
          isCluster ? () => zoomIntoCluster(cluster) : undefined,
        );
      });
    };

    render();
    window.kakao.maps.event.addListener(map, 'idle', render);

    const byDate = new Map<string, RoutePlace[]>();
    shown.forEach((point) => {
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
  }, [map, points, disabledIds, dateFilter]);

  /**
   * 지금 그리는 장소가 전부 담기게 화면을 맞춘다.
   *
   * 고른 날짜가 서로 멀리 떨어져 있으면 기본 중심에선 화면 밖으로 나가고, 날짜를 하나로
   * 좁히면 그 하루가 화면 구석에 작게 남는다. **날짜 필터에도 반응해야 하는 이유가 이것** —
   * 걸러 놓고 화면은 사흘치 범위 그대로면, 좁힌 보람이 지도에는 나타나지 않는다.
   *
   * **장소를 껐다 켤 때는 다시 맞추지 않는다** — 칩 하나 누를 때마다 지도가 튀면 어디를
   * 봤는지 잃어버린다. 그래서 `disabledIds` 가 아니라 그릴 범위(`shownPlaces`)에만 건다.
   */
  const shownPlaces = useMemo(
    () => (dateFilter === null ? points : points.filter((point) => point.date === dateFilter)),
    [points, dateFilter],
  );

  useEffect(() => {
    if (!map || shownPlaces.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    shownPlaces.forEach((point) =>
      bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)),
    );
    map.setBounds(bounds);
  }, [map, shownPlaces]);
}
