import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

import mapIcon from '../assets/icons/map.svg';
import timelineIcon from '../assets/icons/timeline.svg';
import journeyIcon from '../assets/icons/journey.svg';
import blogIcon from '../assets/icons/blog.svg';
import profileIcon from '../assets/icons/profile.svg';

/**
 * 하단 탭바. NavLink 로 현재 경로 탭이 자동 활성화됨.
 * 아이콘은 단색 SVG 1개를 CSS mask 로 재색칠 → 활성 초록(#8BCC6A) / 비활성 검정.
 * (활성·비활성 이미지를 따로 두지 않아 파일/용량 절약)
 */

const ACTIVE_COLOR = '#8BCC6A';
const INACTIVE_COLOR = '#000000';

export interface TabItem {
  to: string;
  label: string;
  icon: string; // 단색 SVG (색은 CSS 로 입힘)
  end?: boolean;
}

const DEFAULT_TABS: TabItem[] = [
  { to: ROUTES.home, label: '지도', icon: mapIcon, end: true },
  { to: ROUTES.timeline, label: '타임라인', icon: timelineIcon },
  { to: ROUTES.journey, label: '동선', icon: journeyIcon },
  { to: ROUTES.blog, label: '블로그', icon: blogIcon },
  { to: ROUTES.profile, label: '마이', icon: profileIcon },
];

type BottomTabBarProps = {
  tabs?: TabItem[];
};

export function BottomTabBar({ tabs = DEFAULT_TABS }: BottomTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className="flex flex-col items-center gap-0.5 py-2 text-xs text-black"
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className="h-6 w-6"
                    style={{
                      backgroundColor: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                      maskImage: `url(${tab.icon})`,
                      WebkitMaskImage: `url(${tab.icon})`,
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                    }}
                  />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}