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

  /*
   * 화면 바닥 띠의 색을 탭바에 맞춘다.
   *
   * iOS PWA 는 뷰포트를 화면보다 상태바 높이만큼 짧게 주면서 그 아래(873~932)를 남긴다.
   * 거긴 요소를 못 놓지만 :root 배경이 칠하는 캔버스라 색은 고를 수 있다(styles.css).
   * 탭 화면은 바닥이 흰 탭바이므로 크림 띠가 붙으면 탭바가 잘린 것처럼 읽힌다(#141).
   *
   * Layout 이 탭 라우트의 부모라 여기가 자리다 — 탭끼리 이동할 땐 언마운트되지 않고,
   * 탭 밖으로 나갈 때만 정리되므로 켜고 끄는 시점이 정확히 맞는다.
   */
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('canvas-tabbar');
    return () => root.classList.remove('canvas-tabbar');
  }, []);

  /*
   * 탭바는 흐름에서 빼고 콘텐츠 위에 얹는다(absolute).
   *
   * 흐름상 배치(flex 형제)로 두면 콘텐츠가 탭바 위쪽에서 직각으로 끊기는데, 탭바
   * 위 모서리는 24px 둥글다. 그 모서리 틈으로 AppShell 의 base 배경이 드러나 탭바
   * 뒤에 직각 판이 한 겹 더 있는 것처럼 보인다. (base 를 크림 #fffcef 로 맞춰 예전만큼
   * 튀지는 않지만, 페이지 배경과 완전히 같은 건 아니라 absolute 로 얹어 틈 자체를 없앤다.)
   *
   * `fixed` 가 아니라 `absolute` 다. fixed 는 iOS PWA 에서 뷰포트가 줄었다 늘 때
   * 탭바가 화면 밖으로 밀리는 문제가 있어 원래 피해 둔 것이고, 여기서는 셸이
   * 기준(relative)이라 absolute 로도 같은 결과를 얻는다.
   *
   * 콘텐츠가 탭바에 가려지지 않도록 각 페이지가 하단 여백을 갖는다.
   */
  return (
    <div className="relative h-full">
      {/* overscroll-none: 스크롤 끝에서 셸로 넘어가며 튕기는 반동 차단 */}
      <div ref={scrollRef} className="h-full overflow-y-auto overscroll-none">
        <Outlet />
      </div>
      {/*
        z-index 는 래퍼에 준다. 탭바 자신에도 z-40 이 있지만 그 요소는
        position: static 이라 z-index 가 먹지 않는다 — 흐름상 배치일 때는 DOM
        순서로 위에 그려져서 문제가 없었지만, 이제는 지도 로딩 오버레이(z-10)가
        탭바를 덮는다.
      */}
      <div className="absolute inset-x-0 bottom-0 z-40">
        <BottomTabBar />
      </div>
    </div>
  );
}
