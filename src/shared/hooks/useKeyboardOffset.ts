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

    const updateOffset = () => {
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, keyboardHeight));
    };

    vv.addEventListener('resize', updateOffset);
    vv.addEventListener('scroll', updateOffset);
    updateOffset();

    return () => {
      vv.removeEventListener('resize', updateOffset);
      vv.removeEventListener('scroll', updateOffset);
    };
  }, []);

  return offset;
}
