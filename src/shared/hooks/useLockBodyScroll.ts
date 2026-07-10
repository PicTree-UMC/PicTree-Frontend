import { useEffect } from 'react';

/**
 * 전체화면 고정 레이아웃 화면에서 document 스크롤을 잠근다.
 * 스크롤 가능한 document가 남아있으면, input 포커스 시 브라우저가
 * "포커스된 요소를 보여주려고" document를 스크롤시켜 fixed 오버레이와 어긋나 보인다.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const { body, documentElement: html } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, []);
}
