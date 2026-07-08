import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

/** 메인 탭 화면들의 공용 레이아웃. 페이지 콘텐츠는 Outlet, 하단 탭바는 항상 고정 렌더링. */
export function Layout() {
  return (
    <>
      <Outlet />
      <BottomTabBar />
    </>
  );
}
