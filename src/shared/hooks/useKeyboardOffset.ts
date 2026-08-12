import { useEffect, useState } from 'react';

/**
 * 모바일 브라우저에서 소프트 키보드가 올라올 때 가려지는 높이(px)를 반환.
 * VisualViewport API로 innerHeight와 실제 보이는 영역의 차이를 계산한다.
 */
export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    /*
      ⚠️ **두 뷰포트를 섞어 읽으므로 양쪽 이벤트를 다 들어야 한다.** `window.innerHeight` 는
      레이아웃 뷰포트, `vv.height` 는 실제로 보이는 영역이고, 키보드는 보통 뒤쪽만 줄인다.

      `visualViewport` 만 구독하던 때는 **회전에서 값이 박혔다.** 돌리면 두 높이가 다
      바뀌는데, `vv.resize` 가 `window.innerHeight` 갱신보다 먼저 오는 순간에 걸리면
      세로 높이 − 가로 높이가 키보드 높이로 잡힌다(수백 px). 그걸 되돌릴 이벤트가 더
      안 와서 저장 버튼이 바닥에서 뜬 채로 남았다.

      그래서 `window` 의 `resize`·`orientationchange` 도 같이 듣는다 — 어느 쪽이 늦게
      갱신되든 마지막에 한 번 더 재므로 제 값으로 수렴한다. `ResizeObserver` 하나로는
      부족했던 `useWelcomeToastAnchor` 와 같은 이유다.

      회전 직후 한 프레임은 두 값이 여전히 어긋날 수 있어 다음 프레임에서 한 번 더 잰다.
    */
    let frame = 0;
    const updateOffset = () => {
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, keyboardHeight));
    };

    const updateSoon = () => {
      updateOffset();
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateOffset);
    };

    vv.addEventListener('resize', updateOffset);
    vv.addEventListener('scroll', updateOffset);
    window.addEventListener('resize', updateSoon);
    window.addEventListener('orientationchange', updateSoon);
    updateOffset();

    return () => {
      window.cancelAnimationFrame(frame);
      vv.removeEventListener('resize', updateOffset);
      vv.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateSoon);
      window.removeEventListener('orientationchange', updateSoon);
    };
  }, []);

  return offset;
}
