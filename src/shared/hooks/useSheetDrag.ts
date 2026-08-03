import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/** 이만큼 내리면 손을 떼는 순간 닫는다. */
const CLOSE_DISTANCE = 80;
/** 짧게 튕겨 내려도 닫히도록 하는 속도 기준(px/ms). */
const CLOSE_VELOCITY = 0.5;
/** 이 이상 움직였으면 '드래그'로 보고, 손 뗀 뒤 따라오는 click 을 무시한다. */
const DRAG_SLOP = 4;
/** 닫힘/복귀 애니메이션 길이(ms). */
const SETTLE_MS = 180;

interface UseSheetDragOptions {
  onClose: () => void;
  /** 열릴 때 슬라이드업(`animate-slide-up-sheet`) 재생 여부. 기본 true. */
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
 * ⚠️ 등장 애니메이션과 인라인 transform 은 같이 못 쓴다 — `.animate-slide-up-sheet` 는
 * `animation-fill-mode: both` 라 재생이 끝난 뒤에도 `translateY(0)` 을 계속 물고 있고,
 * CSS 애니메이션은 인라인 스타일보다 우선한다. 그래서 애니메이션이 끝나면 클래스를 떼어낸다.
 */
export function useSheetDrag<T extends HTMLElement = HTMLDivElement>({
  onClose,
  animateIn = true,
}: UseSheetDragOptions) {
  const sheetRef = useRef<T>(null);
  const [entering, setEntering] = useState(animateIn);

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

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    // 캡처해 두면 손가락이 핸들 밖으로 나가도 이동/해제 이벤트가 계속 들어온다.
    event.currentTarget.setPointerCapture(event.pointerId);
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
    /** 시트 루트에 단다. */
    sheetRef,
    /** 등장 애니메이션 클래스. 재생이 끝나면 빈 문자열이 된다(위 주석 참고). */
    animationClass: entering ? 'animate-slide-up-sheet' : '',
    onAnimationEnd: (event: ReactAnimationEvent<T>) => {
      // 안쪽 요소의 애니메이션도 여기까지 올라온다.
      if (event.target === event.currentTarget) setEntering(false);
    },
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
