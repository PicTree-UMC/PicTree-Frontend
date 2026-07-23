import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

/**
 * 메인 탭 화면들의 공용 레이아웃. dvh 높이의 flex 컬럼으로,
 * 콘텐츠(Outlet)는 스크롤 영역, 하단 탭바는 흐름상 항상 바닥에 배치한다.
 * (fixed 대신 flex 배치라 iOS PWA 뷰포트 quirk 없이 탭바가 항상 보인다.)
 */
export function Layout() {
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * 라우트가 바뀌면 스크롤을 맨 위로 되돌린다.
   *
   * Layout 은 부모 라우트라 탭끼리 이동해도 언마운트되지 않는다(<Outlet /> 안쪽만 교체).
   * 아래 div 가 같은 DOM 노드로 살아남으니 scrollTop 도 그대로 남아, 마이에서 내려둔
   * 오프셋이 지도·타임라인까지 따라온다.
   *
   * <ScrollRestoration> 으로는 못 잡는다. 그건 window 를 스크롤하는데, styles.css 의
   * html,body,#root{height:100%} 때문에 window 는 애초에 스크롤되지 않는다.
   * 실제 스크롤 주체는 이 div 다.
   *
   * useEffect 가 아니라 useLayoutEffect 인 이유: 페인트 전에 되돌려야 새 화면이 이전
   * 오프셋에 그려진 프레임이 한 번 보였다 튀지 않는다.
   */
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-full flex-col">
      {/* overscroll-none: 스크롤 끝에서 셸로 넘어가며 튕기는 반동 차단 */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-none">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
