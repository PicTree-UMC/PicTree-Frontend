import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

/**
 * 메인 탭 화면들의 공용 레이아웃. dvh 높이의 flex 컬럼으로,
 * 콘텐츠(Outlet)는 스크롤 영역, 하단 탭바는 흐름상 항상 바닥에 배치한다.
 * (fixed 대신 flex 배치라 iOS PWA 뷰포트 quirk 없이 탭바가 항상 보인다.)
 */
export function Layout() {
  return (
    <div className="flex h-full flex-col">
      {/* overscroll-none: 스크롤 끝에서 셸로 넘어가며 튕기는 반동 차단 */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-none">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
