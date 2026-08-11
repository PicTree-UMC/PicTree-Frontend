import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * 이만큼 옆으로 밀면 손을 떼는 순간 없앤다.
 *
 * 토스트 폭이 약 358px(컬럼 390 − 좌우 16)이라 72 는 20% 남짓이다. 의도적으로 민 것과
 * 누르다 손이 흔들린 것을 가르기에 충분하면서, 엄지 한 번에 닿는 거리다.
 */
const DISMISS_DISTANCE = 72;

/** 짧게 튕겨도 없어지도록 하는 속도 기준(px/ms). `useSheetDrag` 와 같은 값. */
const DISMISS_VELOCITY = 0.5;

/**
 * 이 이상 움직였으면 '민 것' 으로 보고, 손 뗀 뒤 따라오는 click 을 무시한다.
 *
 * ⚠️ **`useSheetDrag` 의 4 를 그대로 쓰면 안 된다.** 시트는 핸들만 드래그 대상이지만
 * 토스트는 **전체가 탭 타깃**이라, 이 값이 작으면 *누르려다 몇 px 밀린 사람이 토스트를
 * 못 닫는다.*
 *
 * 16 인 이유: 브라우저가 click 을 취소하는 자체 임계값(안드로이드 크로미움 약 8dp)보다
 * **넉넉히 위**여야 한다. 그 아래로 잡으면 "브라우저는 click 을 주는데 우리가 막는" 구간이
 * 생긴다 — #253 에서 실제로 데인 것과 같은 종류의 사각지대다.
 */
const DRAG_SLOP = 16;

/** 없앰/복귀 애니메이션 길이(ms). */
const SETTLE_MS = 180;

/** 밀어낸 방향으로 날려 보내는 거리. 화면 밖까지 확실히 나가도록 폭보다 넉넉히 잡는다. */
const FLING_PX = 480;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface UseSwipeDismissOptions {
  /** 임계값을 넘겨 밀었을 때. 여기서 실제로 목록에서 지운다. */
  onDismiss: () => void;
  /** 밀지 않고 그냥 눌렀을 때. 안 주면 탭은 아무 일도 하지 않는다. */
  onTap?: () => void;
}

/**
 * 옆으로 밀어 없애는 제스처(토스트).
 *
 * `useSheetDrag` 와 얼개는 같지만 **그 훅을 일반화하지 않고 따로 뒀다.** 축(가로/세로),
 * 방향(양쪽/아래만), `touch-action`(pan-y / none), 등장 연출 소유 여부가 전부 달라서,
 * 합치면 플래그만 늘고 양쪽 다 읽기 어려워진다. 대신 **거리+속도 이중 판정과 click 가드**
 * 라는 배운 것은 그대로 가져왔다.
 *
 * ⚠️ **`touchAction: 'pan-y'` 여야 한다 — `none` 이 아니다.** 시트는 화면을 덮는
 * 오버레이라 스크롤을 통째로 막아도 되지만, 토스트는 **뒤 내용이 살아 있는 채로** 화면
 * 가운데에 떠 있다. `none` 을 걸면 사용자가 무심코 토스트 위에서 페이지를 스크롤하려 할 때
 * 그 자리만 먹통이 된다. 가로만 우리가 갖고 세로는 브라우저에 남긴다.
 *
 * ⚠️ **드래그 중에는 상태 대신 ref 로 `style` 을 직접 쓴다.** 포인터 이동마다 리렌더가
 * 돌면 토스트 목록 전체가 다시 그려져 손가락을 못 따라온다.
 *
 * ⚠️ **등장 연출(`animate-fade-in-*`)과 같은 요소에 걸면 안 된다.** 그 키프레임은
 * `animation-fill-mode: both` 라 재생이 끝난 뒤에도 `transform` 을 물고 있고, CSS
 * 애니메이션은 인라인 스타일을 이긴다 — 드래그가 **DOM 에는 반영되는데 화면에서는 안
 * 움직이는** 상태가 된다(TROUBLESHOOTING 2-9). 그래서 부르는 쪽에서 **바깥 래퍼가 등장을,
 * 안쪽 요소가 드래그를** 맡도록 갈라 놓았다.
 */
export function useSwipeDismiss<T extends HTMLElement = HTMLElement>({
  onDismiss,
  onTap,
}: UseSwipeDismissOptions) {
  const ref = useRef<T>(null);

  const drag = useRef<{
    startX: number;
    prevX: number;
    prevTime: number;
    lastX: number;
    lastTime: number;
    offset: number;
  } | null>(null);
  /** 직전 제스처가 '민 것' 이었나. pointerdown 에서 초기화하고 click 가드로 쓴다. */
  const moved = useRef(false);
  const dismissTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(dismissTimer.current), []);

  const setStyle = (x: number, duration = 0) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = duration > 0 ? `transform ${duration}ms ease-out, opacity ${duration}ms ease-out` : 'none';
    el.style.transform = `translateX(${x}px)`;
    /*
      밀린 만큼 흐려진다 — "손을 떼면 없어진다" 를 미리 알려주는 신호다. 임계값에서 딱
      끊지 않고 이어서 옅어지게 두면 어디까지 밀어야 하는지 감이 온다.
      0.35 밑으로는 안 내린다. 완전히 투명해지면 되돌릴 대상이 안 보인다.
    */
    el.style.opacity = String(Math.max(0.35, 1 - Math.abs(x) / (DISMISS_DISTANCE * 2)));
  };

  const onPointerDown = (event: ReactPointerEvent<T>) => {
    // 마우스 오른쪽·가운데 버튼은 무시. 왼쪽(0)과 터치·펜만 받는다.
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    moved.current = false;
    /*
      포인터를 이 요소에 붙들어 둔다. 토스트는 폭이 좁아 **손가락이 요소 밖으로 금방
      나가는데**, 캡처가 없으면 그 순간 pointermove 가 끊겨 토스트가 중간에 멈춘다.
      (시트는 화면을 덮을 만큼 커서 이 문제가 없어 캡처를 안 쓴다.)
    */
    event.currentTarget.setPointerCapture?.(event.pointerId);

    drag.current = {
      startX: event.clientX,
      prevX: event.clientX,
      prevTime: event.timeStamp,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      offset: 0,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<T>) => {
    const state = drag.current;
    if (!state) return;

    // 양쪽 다 열어 둔다 — 어느 손으로 쥐었든 바깥쪽으로 미는 게 자연스럽다.
    state.offset = event.clientX - state.startX;
    state.prevX = state.lastX;
    state.prevTime = state.lastTime;
    state.lastX = event.clientX;
    state.lastTime = event.timeStamp;

    if (Math.abs(state.offset) > DRAG_SLOP) moved.current = true;
    setStyle(state.offset);
  };

  const onPointerUp = () => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;

    const elapsed = state.lastTime - state.prevTime;
    const velocity = elapsed > 0 ? (state.lastX - state.prevX) / elapsed : 0;
    const shouldDismiss =
      Math.abs(state.offset) > DISMISS_DISTANCE ||
      (moved.current && Math.abs(velocity) > DISMISS_VELOCITY);

    if (!shouldDismiss) {
      setStyle(0, SETTLE_MS);
      return;
    }

    /*
      움직임을 줄이라고 한 사용자에게는 날려 보내는 연출을 생략하고 바로 없앤다.
      드래그 자체는 막지 않는다 — 그건 연출이 아니라 사용자가 직접 끄는 직접 조작이다.
    */
    if (prefersReducedMotion()) {
      onDismiss();
      return;
    }

    // 민 방향으로 화면 밖까지 밀어낸 뒤 지운다. 그냥 지우면 토스트가 툭 사라진다.
    // 속도로 없앨 때는 offset 이 0에 가까울 수 있어 **방향은 속도에서** 가져온다.
    const direction = state.offset !== 0 ? Math.sign(state.offset) : Math.sign(velocity) || 1;
    setStyle(direction * FLING_PX, SETTLE_MS);
    const el = ref.current;
    if (el) el.style.opacity = '0';
    // transitionend 를 기다리지 않는다 — 탭이 백그라운드로 가면 안 와서 토스트가 남는다.
    dismissTimer.current = window.setTimeout(onDismiss, SETTLE_MS);
  };

  return {
    /** 드래그 대상에 단다. **등장 연출을 가진 요소와 같아선 안 된다**(위 ⚠️ 참고). */
    ref,
    swipeProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick: () => {
        // 밀었다 놓으면 click 이 뒤따라 온다. 그게 탭으로 읽히면 안 된다.
        if (moved.current) return;
        onTap?.();
      },
      style: { touchAction: 'pan-y' as const },
    },
  };
}
