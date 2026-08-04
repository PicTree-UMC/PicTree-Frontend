import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TreeMarker } from '../components/TreeMarker';
import { ClusterMarker } from '@/shared/components';
import { clusterMarkers, findClusterSplitLevel } from '../lib/cluster';

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

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 등장 애니메이션 길이(ms). styles.css 의 `.animate-marker-pop` 애니메이션 시간과 반드시 일치해야 한다.
 * 스태거 간격을 이 길이와 같게 두어, 마커 하나가 다 뜬 뒤 다음 마커가 시작되도록(순차 등장) 한다.
 */
const MARKER_ANIM_MS = 300;
const STAGGER_STEP_MS = MARKER_ANIM_MS;
/** 순차 등장 상한 — 마커가 아주 많을 때 끝없이 기다리지 않도록, 이 시점 이후는 함께 뜬다. */
const STAGGER_MAX_MS = MARKER_ANIM_MS * 15;

/**
 * 두 지점의 대략적인 거리 제곱(정렬용). 경도는 위도에 따라 좁아지므로 cos 로 보정한다.
 * 실제 거리값은 필요 없고 가까운 순서만 가리면 되므로 제곱근은 생략한다.
 */
function roughDistanceSq(a: LatLng, b: LatLng) {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180);
  return dLat * dLat + dLng * dLng;
}

/** content HTMLElement 를 만들고 클릭 핸들러를 붙인 CustomOverlay 를 생성한다. */
function createOverlay(
  map: kakao.maps.Map,
  lat: number,
  lng: number,
  markup: string,
  onClick: () => void,
  yAnchor = 1, // 기본값: 나무 밑동이 좌표에 닿도록. 원형 클러스터는 0.5로 좌표 정중앙에.
  animationDelayMs?: number, // 값이 있으면 그 지연으로 등장(pop-in) 애니메이션을 붙인다.
) {
  const container = document.createElement('div');
  container.innerHTML = markup;
  container.style.cursor = 'pointer';
  container.addEventListener('click', onClick);

  if (animationDelayMs !== undefined) {
    container.classList.add('animate-marker-pop');
    container.style.animationDelay = `${animationDelayMs}ms`;
  }

  const overlay = new window.kakao.maps.CustomOverlay({
    position: new window.kakao.maps.LatLng(lat, lng),
    content: container,
    yAnchor,
  });
  overlay.setMap(map);
  return overlay;
}

/**
 * 클러스터 뱃지 클릭 처리.
 *
 * 기본 동작은 '줌 인' 이다 — 다만 한 단계씩 찔러보는 게 아니라, 묶인 마커가 둘 이상으로
 * 쪼개지는 레벨을 미리 계산해 그 레벨까지 한 번에 확대한다(anchor 로 클러스터 중심을
 * 고정해 그 지점을 향해 확대). 한 단계 확대해도 그대로 뭉쳐 있어 여러 번 눌러야 하는 걸 없앤다.
 *
 * 단, 최대 줌인(MIN_ZOOM_LEVEL)까지 확대해도 쪼개지지 않으면 좌표가 사실상 겹친 경우라
 * 확대할 이유가 없다. 이때는 줌을 건드리지 않고 곧바로 상세 뷰어(onSelect)로 넘긴다.
 */
function handleClusterClick(
  map: kakao.maps.Map,
  cluster: { lat: number; lng: number; items: MapMarkerData[] },
  onSelect: (group: MapMarkerData[]) => void,
) {
  const splitLevel = findClusterSplitLevel(map, cluster.items);
  if (splitLevel === null) {
    onSelect(cluster.items);
    return;
  }

  map.setLevel(splitLevel, {
    anchor: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
    animate: true, // 즉시 점프 대신 부드럽게 확대되도록 트랜지션을 붙인다.
  });
}

/**
 * 카카오맵 위에 나무 마커를 그리되, 화면상 가까이 붙은 마커는 하나의
 * 클러스터 뱃지로 합쳐 렌더링한다. 줌/이동이 끝날 때(idle)마다 다시 묶는다.
 *
 * content 를 HTMLElement 로 만들어 클릭 이벤트를 직접 붙인다.
 * (renderToStaticMarkup 만으로는 정적 HTML 문자열이라 React 이벤트가 안 붙음)
 *
 * 마커/클러스터를 탭하면 그 안에 묶인 나무들의 배열을 그대로 넘긴다.
 * (단일 마커는 길이 1, 클러스터는 묶인 만큼) — 상세 뷰어가 좌우로 넘겨 보여준다.
 *
 * 최초로 마커가 그려질 때 한 번, origin(사용자 위치)에서 가까운 순서대로
 * 등장(pop-in) 애니메이션을 스태거로 적용한다. 이후 줌/이동 재렌더에는 붙지 않는다.
 */
export function useMapMarkers(
  map: kakao.maps.Map | null,
  markers: MapMarkerData[],
  onSelect: (group: MapMarkerData[]) => void,
  origin?: LatLng | null,
) {
  // 등장 애니메이션은 첫 렌더에서 한 번만. idle(줌/이동) 재렌더에는 다시 붙이지 않는다.
  const didAnimateRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    let overlays: kakao.maps.CustomOverlay[] = [];

    const clearOverlays = () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];
    };

    const render = () => {
      clearOverlays();
      const clusters = clusterMarkers(map, markers);

      // 첫 렌더에만 거리순 스태거 지연을 계산한다. origin 이 없으면 지도 중심을 기준으로.
      const animate = !didAnimateRef.current && clusters.length > 0;
      const delays: (number | undefined)[] = clusters.map(() => undefined);
      if (animate) {
        const center = map.getCenter();
        const from = origin ?? { lat: center.getLat(), lng: center.getLng() };
        clusters
          .map((cluster, index) => ({ index, dist: roughDistanceSq(from, cluster) }))
          .sort((a, b) => a.dist - b.dist)
          .forEach((entry, rank) => {
            delays[entry.index] = Math.min(rank * STAGGER_STEP_MS, STAGGER_MAX_MS);
          });
      }

      overlays = clusters.map((cluster, index) => {
        if (cluster.items.length === 1) {
          const marker = cluster.items[0];
          return createOverlay(
            map,
            marker.lat,
            marker.lng,
            renderToStaticMarkup(<TreeMarker emoji={marker.emoji} label={marker.label} />),
            () => onSelect(cluster.items),
            1,
            delays[index],
          );
        }

        return createOverlay(
          map,
          cluster.lat,
          cluster.lng,
          renderToStaticMarkup(<ClusterMarker count={cluster.items.length} />),
          () => handleClusterClick(map, cluster, onSelect),
          0.5, // 원형 뱃지를 좌표 정중앙에 놓는다.
          delays[index],
        );
      });

      if (animate) didAnimateRef.current = true;
    };

    render();
    window.kakao.maps.event.addListener(map, 'idle', render);

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', render);
      clearOverlays();
    };
  }, [map, markers, onSelect, origin]);
}
