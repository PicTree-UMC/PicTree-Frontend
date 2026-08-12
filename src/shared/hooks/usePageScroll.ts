import { createContext, useCallback, useContext, type RefObject } from 'react';

/**
 * 탭 화면이 **실제로** 스크롤되는 컨테이너.
 *
 * `styles.css` 의 `html,body,#root{height:100%}` 때문에 window 는 애초에 스크롤되지 않는다.
 * 스크롤 주체는 `Layout` 안의 div 하나뿐인데, 페이지는 `<Outlet />` 안쪽이라 그 노드를
 * 가리킬 방법이 없었다 — 그래서 여기로 내보낸다.
 *
 * ⚠️ **`scrollIntoView` 로 대신하지 않는다.** 그건 조상 스크롤 컨테이너를 전부 움직여서
 * 어느 축이 얼마나 움직일지 부르는 쪽이 못 정한다(`RoutePlaceStrip`·`RouteTray` 가 같은
 * 이유로 피해 뒀다). 컨테이너의 `scrollTop` 만 건드리는 편이 예측 가능하다.
 */
export const PageScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
);

/**
 * 페이지 스크롤 조작. `Layout` 바깥(탭바 없는 화면)에서 부르면 아무 일도 하지 않는다 —
 * 거기엔 되돌릴 스크롤 자체가 없으므로 에러로 만들지 않는다.
 */
export function usePageScroll() {
  const ref = useContext(PageScrollContext);

  /*
    ref 객체의 정체성은 안 바뀌므로 이 콜백도 렌더마다 새로 생기지 않는다 —
    이벤트 핸들러나 effect 의존성에 그대로 넣어도 안전하다.
  */
  const scrollToTop = useCallback(() => {
    ref?.current?.scrollTo({ top: 0 });
  }, [ref]);

  return { scrollToTop };
}
