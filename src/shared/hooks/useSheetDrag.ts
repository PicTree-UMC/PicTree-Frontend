import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

/** 이만큼 내리면 손을 떼는 순간 닫는다. */
const CLOSE_DISTANCE = 80;
/** 짧게 튕겨 내려도 닫히도록 하는 속도 기준(px/ms). */
const CLOSE_VELOCITY = 0.5;
/** 이 이상 움직였으면 '드래그'로 보고, 손 뗀 뒤 따라오는 click 을 무시한다. */
const DRAG_SLOP = 4;
/** 닫힘/복귀 애니메이션 길이(ms). */
const SETTLE_MS = 180;
/** 등장 슬라이드업 길이(ms). 예전 `.animate-slide-up-sheet` 와 같은 값. */
const ENTER_MS = 250;

interface UseSheetDragOptions {
  onClose: () => void;
  /** 열릴 때 아래에서 올라오는 등장 연출. 기본 true. */
  animateIn?: boolean;
}

/**
 * 바텀시트를 아래로 끌어 닫는다.
 *
 * 드래그 중에는 상태 대신 ref 로 `style.transform` 을 직접 쓴다 —
 * 포인터 이동마다 리렌더가 돌면 시트 안 목록까지 같이 다시 그려져 손가락을 못 따라온다.
 *
 * `handleProps` 는 **핸들에만** 편다. 시트 전체에 걸면 안쪽 스크롤 목록이나 지도가
 * 드래그를 못 받는다. `touchAction: 'none'` 이 브라우저 기본 스크롤을 막아 준다.
 *
 * ⚠️ **등장 연출도 여기서 같은 인라인 transform 으로 굴린다.** `.animate-slide-up-sheet`
 * 같은 CSS 키프레임과는 섞을 수 없다 — `animation-fill-mode: both` 가 재생이 끝난 뒤에도
 * `translateY(0)` 을 물고 있고 CSS 애니메이션은 인라인 스타일을 이겨서, 드래그가
 * **DOM 에는 반영되는데 화면에서는 안 움직이는** 상태가 된다(TROUBLESHOOTING 2-9).
 * 클래스를 `animationend` 에 떼는 우회는 쓰지 않는다. 그 이벤트가 안 오는 환경이 실제로 있다.
 */
export function useSheetDrag<T extends HTMLElement = HTMLDivElement>({
  onClose,
  animateIn = true,
}: UseSheetDragOptions) {
  const sheetRef = useRef<T>(null);

  const drag = useRef<{
    startY: number;
    prevY: number;
    prevTime: number;
    lastY: number;
    lastTime: number;
    offset: number;
  } | null>(null);
  /** 직전 제스처가 드래그였는가. pointerdown 에서 초기화하고 click 가드로 쓴다. */
  const moved = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const setTransform = (y: number, duration = 0) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = duration > 0 ? `transform ${duration}ms ease-out` : 'none';
    el.style.transform = `translateY(${y}px)`;
  };

  /**
   * 등장 — 제 높이만큼 아래에서 시작해 제자리로 올린다.
   * (화면 높이로 잡으면 작은 시트가 쓸데없이 멀리서 날아온다.)
   *
   * ⚠️ 두 값을 그냥 잇달아 쓰면 브라우저가 하나로 합쳐 전환이 통째로 생략된다.
   * **`offsetHeight` 를 읽어 리플로우를 강제**해 시작 위치를 확정시킨 뒤 목표를 준다.
   * `requestAnimationFrame` 으로 나누는 흔한 방법은 쓰지 않는다 — 탭이 보이지 않으면
   * 콜백이 아예 안 돌아서 시트가 화면 밖에 멈춘 채 남는다(실측: `visibilityState==='hidden'`).
   */
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!animateIn || !el) return;

    setTransform(el.offsetHeight);
    void el.offsetHeight;
    setTransform(0, ENTER_MS);
    // 마운트 시 한 번. animateIn 이 도중에 바뀌어도 다시 등장시키지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    try {
      // 캡처해 두면 손가락이 핸들 밖으로 나가도 이동/해제 이벤트가 계속 들어온다.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 이미 놓인 포인터면 NotFoundError 가 난다. 캡처는 편의일 뿐이라 없어도 드래그는 된다.
    }
    moved.current = false;
    drag.current = {
      startY: event.clientY,
      prevY: event.clientY,
      prevTime: event.timeStamp,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      offset: 0,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state) return;

    // 위로는 끌리지 않는다 — 시트가 화면 위로 떠오르면 아래에 빈 틈이 생긴다.
    state.offset = Math.max(0, event.clientY - state.startY);
    state.prevY = state.lastY;
    state.prevTime = state.lastTime;
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;

    if (state.offset > DRAG_SLOP) moved.current = true;
    setTransform(state.offset);
  };

  const onPointerUp = () => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;

    const elapsed = state.lastTime - state.prevTime;
    const velocity = elapsed > 0 ? (state.lastY - state.prevY) / elapsed : 0;
    const shouldClose =
      state.offset > CLOSE_DISTANCE || (moved.current && velocity > CLOSE_VELOCITY);

    if (!shouldClose) {
      setTransform(0, SETTLE_MS);
      return;
    }

    // 언마운트 전에 화면 밖까지 밀어낸다. 그냥 지우면 시트가 툭 사라진다.
    const height = sheetRef.current?.offsetHeight ?? window.innerHeight;
    setTransform(height, SETTLE_MS);
    // transitionend 를 기다리지 않는다 — 탭이 백그라운드로 가면 안 와서 시트가 남는다.
    closeTimer.current = window.setTimeout(onClose, SETTLE_MS);
  };

  return {
    /** 시트 루트에 단다. 등장·드래그·닫힘이 전부 이 요소의 `transform` 하나로 돈다. */
    sheetRef,
    /**
     * 핸들에 편다. 핸들은 `<button>` 이어야 한다 —
     * 드래그가 안 되는 입력(키보드·보조기술)에서는 탭/엔터로 닫히는 게 유일한 길이다.
     */
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick: () => {
        // 끌었다 놓으면 click 이 뒤따라 온다. 제자리로 돌아온 시트를 그게 닫아 버리면 안 된다.
        if (moved.current) return;
        onClose();
      },
      style: { touchAction: 'none' as const },
    },
  };
}
