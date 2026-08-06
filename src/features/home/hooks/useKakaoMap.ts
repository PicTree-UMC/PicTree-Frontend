import { useEffect, useRef, useState } from 'react';
import { useKakaoSdkStore } from '@/shared/lib/kakaoSdkStore';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/** 좌표가 주어지지 않을 때의 기본 중심(서울시청). */
const DEFAULT_CENTER: LatLngLiteral = { lat: 37.5665, lng: 126.978 };

/**
 * 최대 줌인(가장 확대) 레벨. 카카오맵은 level 이 작을수록 확대된 상태다.
 * 기본 최소 레벨은 타일에 따라 달라질 수 있어, 클러스터 클릭 예외처리 등에서
 * "최대 줌인인지"를 안정적으로 판단하려고 여기서 1로 못박는다(setMinLevel).
 */
export const MIN_ZOOM_LEVEL = 1;

/**
 * 오버레이(마커·말풍선)가 들어가는 SDK 내부 레이어를 찾는다 (이슈 #114 의 두 처리가 다 이걸 쓴다).
 *
 * 임시 오버레이를 하나 붙였다 떼면서 **그 조상에서** 찾는다. 자식 순서(index)로 집으면
 * SDK 가 레이어를 하나 더 끼워 넣는 순간 엉뚱한 걸 집는다. 못 찾으면 `null` 을 주고,
 * 부르는 쪽은 조용히 지나간다(지도는 그대로 뜨고 #114 보정만 빠진다).
 */
function findOverlayLayer(map: kakao.maps.Map, container: HTMLElement): HTMLElement | null {
  const probeContent = document.createElement('div');
  const probe = new window.kakao.maps.CustomOverlay({
    position: map.getCenter(),
    content: probeContent,
  });
  probe.setMap(map);

  // 오버레이 레이어는 지도 컨테이너의 세 단계 아래에 있다(레이어 < 레이어박스 < 뷰포트 < 컨테이너).
  let node: HTMLElement | null = probeContent;
  let layer: HTMLElement | null = null;
  while (node && node !== container) {
    if (node.parentElement?.parentElement?.parentElement === container) {
      layer = node;
      break;
    }
    node = node.parentElement;
  }

  probe.setMap(null);
  return layer;
}

/**
 * `zoom_start` 부터 SDK 줌 애니메이션이 끝날 때까지의 길이(실측 300ms).
 * 앞의 20ms 남짓은 아직 안 움직이는 구간인데, 그건 아래 이징 표의 첫 두 점이 담고 있다.
 */
const ZOOM_ANIM_MS = 300;

/** 줌이 시작되고 이 시간 안에 레벨이 확정되지 않으면 보정을 포기한다. */
const LEVEL_SETTLE_MS = 80;

/** 보정 루프를 붙들고 있는 한계. `zoom_changed` 가 안 와도 여기서 끊는다. */
const ZOOM_HOLD_MS = ZOOM_ANIM_MS * 4;

/**
 * 실측한 SDK 줌 이징. `[시간 비율, 진행률]` 이고 사이는 선형 보간한다.
 *
 * 진행률은 픽셀이 아니라 **줌 단계(로그) 기준**이다 — 축척은 레벨당 2배씩 변하므로
 * 배율은 `scale ** 진행률` 로 구한다.
 *
 * 재는 법: 타일 `<img>` 폭을 프레임마다 기록해 `log2(폭/시작폭) / log2(끝폭/시작폭)` 을 본다.
 * 절차와 함정(탭이 가려지면 애니메이션이 안 돈다)은 TROUBLESHOOTING `1-7`.
 *
 * ⚠️ 값은 **줌인 1단계**를 잰 것이다. 줌아웃은 곡선이 이것보다 완만해 보였는데(같은 방식으로
 * 재도 중간값이 0.15 쯤 낮았다) 타일 `<img>` 가 도중에 교체돼 측정을 믿기 어려웠다.
 * 그 차이는 중간 한때 배율로 1.1배, 고정점에서 200px 떨어진 마커 기준 20px 남짓이고
 * **끝에서는 0 으로 수렴한다**(아래 base 갈아타기). 더 맞추려면 줌아웃부터 다시 재야 한다.
 */
const ZOOM_EASE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.057, 0],
  [0.083, 0.077],
  [0.137, 0.214],
  [0.19, 0.326],
  [0.247, 0.43],
  [0.303, 0.524],
  [0.36, 0.6],
  [0.417, 0.672],
  [0.47, 0.731],
  [0.527, 0.785],
  [0.583, 0.83],
  [0.667, 0.889],
  [0.75, 0.934],
  [0.833, 0.966],
  [0.917, 0.989],
  [1, 1],
];

function easeZoom(ratio: number) {
  for (let i = 1; i < ZOOM_EASE.length; i += 1) {
    const [x1, y1] = ZOOM_EASE[i];
    if (ratio <= x1) {
      const [x0, y0] = ZOOM_EASE[i - 1];
      return y0 + ((y1 - y0) * (ratio - x0)) / (x1 - x0);
    }
  }
  return 1;
}

interface PinnedOverlay {
  el: HTMLElement;
  /** 확대 고정점에서 이 마커까지의 거리. 배율 k 일 때 옮길 거리는 이 값 × (k - 1) 이다. */
  dx: number;
  dy: number;
  /**
   * 잡아둘 당시의 인라인 `left` 를 **문자열 그대로** 들고 있는다. 이게 달라지면 SDK 나 재렌더가
   * 좌표를 갈아끼웠다는 뜻이다. 숫자로 비교하면 `left` 가 없는 오버레이에서 `NaN !== NaN` 이라
   * 매 프레임 "바뀌었다"가 되어 보정이 통째로 무너진다.
   */
  left: string;
}

/**
 * 확대의 **고정점(anchor)** 을 역산한다. 결과는 마커의 `left/top` 과 같은 레이어 기준 좌표다.
 *
 * 확대는 `새 위치 = A + (옛 위치 - A) × 배율` 이다. 옛 화면에서 지도 중심은 컨테이너
 * 정중앙(c)에 있었으니, 그 좌표가 새 상태에서 어디로 갔는지(q)만 보면 A 가 풀린다.
 * 클러스터를 눌러 한쪽을 붙잡고 확대했든(`setLevel` 의 anchor) 화면 한가운데를 확대했든 같다.
 *
 * 좌표계를 옮기는 근거: `left + 레이어오프셋 === containerPointFromCoords` 인 것을
 * 브라우저에서 확인했다.
 */
function solveZoomAnchor(
  map: kakao.maps.Map,
  container: HTMLElement,
  layer: HTMLElement,
  fromCenter: kakao.maps.LatLng,
  scale: number,
) {
  const center = { x: container.clientWidth / 2, y: container.clientHeight / 2 };
  const moved = map.getProjection().containerPointFromCoords(fromCenter);
  const containerRect = container.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();

  return {
    x: (moved.x - scale * center.x) / (1 - scale) + containerRect.left - layerRect.left,
    y: (moved.y - scale * center.y) / (1 - scale) + containerRect.top - layerRect.top,
  };
}

/** 지금 레이어에 붙어 있는 마커들의 좌표를 고정점 기준 거리로 재 둔다. */
function measurePins(layer: HTMLElement, anchor: { x: number; y: number }): PinnedOverlay[] {
  return Array.from(layer.children)
    .map((child) => {
      const el = child as HTMLElement;
      return {
        el,
        left: el.style.left,
        dx: parseFloat(el.style.left) - anchor.x,
        dy: parseFloat(el.style.top) - anchor.y,
      };
    })
    .filter((pin) => Number.isFinite(pin.dx) && Number.isFinite(pin.dy));
}

/**
 * 줌 애니메이션이 도는 동안 마커를 **지도 위 제자리에** 붙여 둔다 (이슈 #114).
 *
 * SDK 는 오버레이 좌표를 애니메이션이 **끝날 때** 갱신한다. 그래서 레이어만 다시 보이게
 * 해두면(`.map-overlay-layer`) 지도가 마커 밑에서 먼저 확대·축소되고 마커는 끝에 가서야 툭
 * 옮겨 앉는다. 여기서 그 0.3초 동안의 위치를 대신 만들어 준다 — 타일이 움직이는 만큼 마커도
 * 같이 움직인다. 미는 건 `transform: translate` 하나뿐이라 마커 크기·앵커 여백은 그대로다
 * (레이어째 `scale` 하면 앵커 여백까지 커져 마커가 좌표에서 밀리고 글자도 2배로 출렁인다).
 *
 * **기준이 되는 좌표는 도중에 바뀐다.** 지도가 확대되는 사이에도
 * ① `useMapMarkers` 가 `idle` 을 받아 마커를 다시 그리고(실측 t≈240ms, 묶임이 달라지므로),
 * ② 애니메이션 끝에는 SDK 가 좌표를 갱신한다. 둘 다 **이미 최종 배율의 좌표**다.
 * 그래서 `left` 가 우리가 잰 값과 달라지면 그 시점부터 기준을 최종 배율로 갈아탄다(`base`).
 * 보정량은 `(마커 - 고정점) × (k / base - 1)` 이라 어느 쪽이든 같은 식으로 풀리고,
 * 애니메이션이 끝나면 `k === base` 라 보정량이 0 으로 수렴한다 — **마지막에 튀지 않는다.**
 *
 * SDK 가 진행률을 안 알려줘서 **길이와 이징은 실측해 재현**한다(`ZOOM_ANIM_MS`, `ZOOM_EASE`).
 * 레벨이 곧바로 확정되지 않는 줌 경로(모델이 안 맞는 경우)에서는 보정을 걷는다 — 그때는
 * 마커가 제자리에 멈춰 있을 뿐이고, 사라지지는 않는다.
 */
function pinOverlaysDuringZoom(map: kakao.maps.Map, container: HTMLElement, layer: HTMLElement) {
  let frame = 0;
  let pins: PinnedOverlay[] | null = null;

  const clear = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pins?.forEach((pin) => pin.el.style.removeProperty('transform'));
    pins = null;
  };

  const handleZoomStart = () => {
    clear();

    const startedAt = performance.now();
    const fromLevel = map.getLevel();
    const fromCenter = map.getCenter();
    let anchor: { x: number; y: number } | null = null;
    let scale = 1;
    let base = 1;

    const step = () => {
      frame = requestAnimationFrame(step);
      const elapsed = performance.now() - startedAt;

      /*
        정리는 `zoom_changed` 가 하지만, 그게 안 오는 줌 경로가 있어도 rAF 루프가 남지 않게
        못을 박는다. 모바일에서 도는 루프라 새는 쪽이 어긋나는 쪽보다 나쁘다.
        이 시점이면 보정량은 이미 0 으로 수렴해 있어서 걷어도 티가 안 난다.
      */
      if (elapsed > ZOOM_HOLD_MS) {
        clear();
        return;
      }

      if (!anchor) {
        // 레벨은 애니메이션이 시작되고 한 프레임쯤 뒤에 최종값이 된다(실측 ~20ms).
        if (map.getLevel() === fromLevel) {
          if (elapsed > LEVEL_SETTLE_MS) clear();
          return;
        }
        scale = 2 ** (fromLevel - map.getLevel());
        if (scale === 1) {
          clear();
          return;
        }
        anchor = solveZoomAnchor(map, container, layer, fromCenter, scale);
        pins = measurePins(layer, anchor);
      }

      // 마커가 새로 그려졌거나(마커째 갈리므로 isConnected 로 잡힌다) SDK 가 좌표를 옮겼으면,
      // 그 값은 이미 최종 배율 기준이다.
      const current = pins ?? [];
      const restated = current.some((pin) => !pin.el.isConnected || pin.el.style.left !== pin.left);
      if (restated) {
        current.forEach((pin) => pin.el.style.removeProperty('transform'));
        pins = measurePins(layer, anchor);
        base = scale;
      }

      // 애니메이션이 끝나도 루프를 세우지 않는다 — 보정량이 0 이라 놀고 있을 뿐이고,
      // 위 갈아타기가 한 프레임 안에 따라붙어야 마지막에 어긋나지 않는다. 정리는 zoom_changed 가 한다.
      const progress = easeZoom(Math.min(elapsed / ZOOM_ANIM_MS, 1));
      const shift = scale ** progress / base - 1;
      pins?.forEach((pin) => {
        pin.el.style.transform = `translate(${pin.dx * shift}px, ${pin.dy * shift}px)`;
      });
    };

    frame = requestAnimationFrame(step);
  };

  window.kakao.maps.event.addListener(map, 'zoom_start', handleZoomStart);
  window.kakao.maps.event.addListener(map, 'zoom_changed', clear);

  return () => {
    window.kakao.maps.event.removeListener(map, 'zoom_start', handleZoomStart);
    window.kakao.maps.event.removeListener(map, 'zoom_changed', clear);
    clear();
  };
}

/**
 * 카카오맵을 생성한다.
 * center 가 null 이면(현재 위치 확인 중) 지도를 아직 만들지 않고 대기하고,
 * 좌표가 정해지면 그 위치에서 지도를 연다(초기 위치 튐 방지).
 */
export function useKakaoMap(center: LatLngLiteral | null = DEFAULT_CENTER, level = 3) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const status = useKakaoSdkStore((s) => s.status);
  const load = useKakaoSdkStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status !== 'loaded' || !containerRef.current || !center) return;

    const kakaoMap = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level,
    });
    // 최대 줌인 레벨을 고정해, 클러스터 클릭 예외처리가 참조할 기준(MIN_ZOOM_LEVEL)을 명확히 한다.
    kakaoMap.setMinLevel(MIN_ZOOM_LEVEL);

    /*
      줌 애니메이션 동안 마커가 사라지는 문제(이슈 #114). 두 가지가 같이 필요하다.
      ① SDK 가 오버레이 레이어에 거는 `display:none` 을 CSS 로 되돌린다(.map-overlay-layer)
      ② SDK 가 애니메이션 끝에야 옮기는 마커 좌표를 그동안 대신 만들어 준다
      경위는 pinOverlaysDuringZoom 주석과 TROUBLESHOOTING 1-7 에 있다.
    */
    const overlayLayer = findOverlayLayer(kakaoMap, containerRef.current);
    overlayLayer?.classList.add('map-overlay-layer');
    const unpinOverlays = overlayLayer
      ? pinOverlaysDuringZoom(kakaoMap, containerRef.current, overlayLayer)
      : undefined;

    setMap(kakaoMap);

    return () => {
      unpinOverlays?.();
      setMap(null); // 컴포넌트가 사라지면 이 map 인스턴스 참조도 함께 해제
    };
    // center 는 위치 확인 후 한 번만 정해지므로 객체 식별자 대신 lat/lng 값으로 의존성을 건다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, center?.lat, center?.lng, level]);
  
  // 컨테이너 크기가 바뀌면(시트/키보드 등장 등) 카카오맵은 새로 노출된 영역을 회색 빈 타일로 남겨두기 떄문에 타일을 다시 그려줌
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !container) return;

    const observer = new ResizeObserver(() =>
      (map as kakao.maps.Map & { relayout: () => void }).relayout(),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return { containerRef, map };
}
