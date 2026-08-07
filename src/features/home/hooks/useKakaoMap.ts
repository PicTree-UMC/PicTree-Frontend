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

/** 배율이 1 에서 이만큼 안쪽이면 줌이 아니라고 본다(부동소수 오차 여유). */
const SCALE_EPSILON = 0.002;

/**
 * 줌이 멎고 이만큼 더 조용하면 rAF 루프를 접는다.
 * `zoom_start` 가 온 뒤에도 배율은 한동안 1 이라(실측 ~20ms) 그 구간을 넘길 만큼은 되어야 한다.
 */
const IDLE_STOP_MS = 200;

/** SDK 가 배율 프록시 박스를 지도의 몇 배로 까는지. 이 비율로 박스를 찾아낸다. */
const PROBE_SIZE_RATIO = 5;

/**
 * SDK 가 **지금 화면에 실제로 걸어 둔 배율**을 읽어낼 박스를 찾는다 (아래 보정의 유일한 입력).
 *
 * 오버레이 페인 안쪽에 지도의 5배 크기로 깔려 있는 박스다. 이걸 쓰는 이유는 **줌 경로가 셋인데
 * 이 박스 하나로 다 잡히기 때문**이다.
 *
 * | 경로 | SDK 가 하는 일 |
 * |---|---|
 * | 핀치 제스처 (손가락 따라, 길이 제한 없음) | 부모 페인에 `transform: scale()` — 모바일 UA 에서만 도는 코드다 |
 * | 핀치 마무리 (실측 ~110ms) | 이 박스의 `left/top/width/height` 를 직접 애니메이션 |
 * | 더블탭·휠·`setLevel` (실측 300ms) | 위와 같음 |
 *
 * 어느 쪽이든 `getBoundingClientRect()` 한 번이면 화면상 실제 배율로 환산된다.
 * **그래서 SDK 의 이징 곡선을 재현할 필요가 없다** — 재현하던 시절에는 경로마다 길이가 달라
 * (300ms vs 110ms) 핀치가 어긋났다.
 *
 * 못 찾으면 `null` 을 주고 부르는 쪽은 조용히 지나간다(마커는 보이되 보정만 빠진다).
 */
function findZoomScaleProbe(container: HTMLElement, layer: HTMLElement): HTMLElement | null {
  const panes = layer.parentElement;
  if (!panes || !container.clientWidth) return null;

  for (const pane of Array.from(panes.children)) {
    const box = pane.firstElementChild as HTMLElement | null;
    if (!box) continue;
    // 크기로 집는다. 자식 순서로 집으면 SDK 가 페인을 하나 더 끼워 넣는 순간 엉뚱한 걸 집는다.
    const ratio = parseFloat(box.style.width) / container.clientWidth;
    if (Math.abs(ratio - PROBE_SIZE_RATIO) < 0.1) return box;
  }
  return null;
}

/**
 * 줌이 도는 동안 마커를 **지도 위 제자리에** 붙여 둔다 (이슈 #114).
 *
 * SDK 는 마커가 사는 오버레이 레이어를 줌 내내 `display:none` 으로 숨겼다가 **끝날 때** 좌표를
 * 갱신한다. 레이어만 다시 보이게 해두면(`.map-overlay-layer`) 지도가 마커 밑에서 먼저 확대되고
 * 마커는 끝에 가서야 툭 옮겨 앉는다. 여기서 그동안의 위치를 대신 만들어 준다.
 *
 * 미는 건 `transform: translate` 하나뿐이라 마커 크기·앵커 여백은 그대로다 (레이어째 `scale`
 * 하면 앵커 여백까지 커져 마커가 좌표에서 밀리고 글자도 2배로 출렁인다).
 *
 * **상태를 안 들고 있는 게 핵심이다.** 매 프레임 배율과 마커 좌표를 처음부터 다시 읽으므로
 * ① 도중에 `useMapMarkers` 가 마커를 새로 그려도(묶임이 달라진다) ② SDK 가 좌표를 갱신해도
 * 그냥 따라간다. 줌이 끝나면 배율이 1 로 돌아와 보정량이 0 이 되므로 **마지막에 튀지 않는다.**
 */
function syncOverlaysWithZoom(
  map: kakao.maps.Map,
  container: HTMLElement,
  layer: HTMLElement,
  probe: HTMLElement,
) {
  let frame = 0;
  let pinching = false;
  let quietSince = 0;
  /** 배율 1 일 때의 프록시 좌표. 지도를 끌면 바뀌므로 줌이 시작될 때마다 다시 잡는다. */
  let rest: { left: number; top: number } | null = null;
  /**
   * 보정을 걸어 둔 마커들. **레이어를 훑어서 걷으면 안 된다** — 줌 도중 화면 밖으로 나간 마커는
   * SDK 가 DOM 에서 떼어내고 나중에 그대로 다시 붙이는데, 떼어져 있는 동안은 안 잡혀서
   * 옛 보정을 달고 되돌아온다(레벨이 바뀐 뒤에도 마커가 엉뚱한 데 찍힌다).
   */
  const shifted = new Set<HTMLElement>();

  const clearTransforms = () => {
    shifted.forEach((el) => el.style.removeProperty('transform'));
    shifted.clear();
  };

  /** 지금 화면 상태에 맞춰 마커를 한 번 민다. 줌이 도는 중이 아니면 `false`. */
  const sync = () => {
    const restWidth = PROBE_SIZE_RATIO * container.clientWidth;
    if (!restWidth) return false;

    const probeRect = probe.getBoundingClientRect();
    const scale = probeRect.width / restWidth;

    if (Math.abs(scale - 1) < SCALE_EPSILON) {
      rest = { left: parseFloat(probe.style.left), top: parseFloat(probe.style.top) };
      if (shifted.size) clearTransforms();
      return false;
    }
    // 배율이 이미 1 이 아닌 채로 끼어들었으면 기준이 없다. 이번 줌은 건너뛴다(멈춰 있을 뿐이다).
    if (!rest) return true;

    const layerRect = layer.getBoundingClientRect();
    for (let i = 0; i < layer.children.length; i += 1) {
      const el = layer.children[i] as HTMLElement;
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      // (있어야 할 화면 위치) - (지금 있는 화면 위치). 확대는 프록시를 기준점 삼은 닮음변환이다.
      const dx = probeRect.left + (x - rest.left) * scale - (layerRect.left + x);
      const dy = probeRect.top + (y - rest.top) * scale - (layerRect.top + y);
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      shifted.add(el);
    }
    return true;
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const step = () => {
    frame = requestAnimationFrame(step);
    if (sync()) quietSince = performance.now();
    else if (!pinching && performance.now() - quietSince > IDLE_STOP_MS) stop();
  };

  const start = () => {
    quietSince = performance.now();
    if (frame) return;
    sync(); // 첫 프레임을 기다리지 않고 여기서 기준(rest)부터 잡는다
    frame = requestAnimationFrame(step);
  };

  /*
    핀치는 `zoom_start` 를 안 쏜다 — SDK 는 제스처 내내 레벨을 그대로 두고 페인만 scale 하다가
    손을 뗄 때서야 레벨을 확정한다. 그래서 시작 신호를 터치에서 직접 받는다. iOS 는 줌 자체를
    gesture 이벤트로 처리하지만 touch 이벤트도 같이 오므로 두 OS 가 이 코드로 같이 걸린다.
  */
  const handleTouch = (event: TouchEvent) => {
    pinching = event.touches.length >= 2;
    // 손을 뗄 때도 부른다 — 그때부터 마무리 애니메이션(~110ms)이 돈다.
    if (pinching || event.type !== 'touchstart') start();
  };

  /*
    손가락이 움직인 그 프레임 안에 따라붙도록 rAF 를 기다리지 않고 한 번 민다.
    SDK 의 핸들러는 하위 페인에 걸려 있어 버블링 순서상 배율이 이미 갱신된 뒤다.
  */
  const handleTouchMove = (event: TouchEvent) => {
    if (frame && event.touches.length >= 2) sync();
  };

  window.kakao.maps.event.addListener(map, 'zoom_start', start);
  container.addEventListener('touchstart', handleTouch, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });
  container.addEventListener('touchend', handleTouch, { passive: true });
  container.addEventListener('touchcancel', handleTouch, { passive: true });

  return () => {
    window.kakao.maps.event.removeListener(map, 'zoom_start', start);
    container.removeEventListener('touchstart', handleTouch);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouch);
    container.removeEventListener('touchcancel', handleTouch);
    stop();
    clearTransforms();
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
      줌 동안 마커가 사라지고 어긋나는 문제(이슈 #114). 두 가지가 같이 필요하다.
      ① SDK 가 오버레이 레이어에 거는 `display:none` 을 CSS 로 되돌린다(.map-overlay-layer)
      ② SDK 가 줌 끝에야 옮기는 마커 좌표를 그동안 대신 만들어 준다
      ①만 하면 마커가 보이는 채로 얼어붙는다 — 핀치처럼 제스처가 길면 특히 티가 난다.
      경위는 syncOverlaysWithZoom 주석과 TROUBLESHOOTING 1-7 에 있다.
    */
    const overlayLayer = findOverlayLayer(kakaoMap, containerRef.current);
    overlayLayer?.classList.add('map-overlay-layer');
    const scaleProbe = overlayLayer
      ? findZoomScaleProbe(containerRef.current, overlayLayer)
      : null;
    const unsyncOverlays =
      overlayLayer && scaleProbe
        ? syncOverlaysWithZoom(kakaoMap, containerRef.current, overlayLayer, scaleProbe)
        : undefined;

    setMap(kakaoMap);

    return () => {
      unsyncOverlays?.();
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
