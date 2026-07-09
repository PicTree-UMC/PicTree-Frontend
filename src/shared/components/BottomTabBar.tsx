import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

import mapIcon from '../assets/icons/map.svg';
import mapActive from '../assets/icons/map-active.svg';
import timelineIcon from '../assets/icons/timeline.svg';
import timelineActive from '../assets/icons/timeline-active.svg';
import journeyIcon from '../assets/icons/journey.svg';
import journeyActive from '../assets/icons/journey-active.svg';
import blogIcon from '../assets/icons/blog.svg';
import blogActive from '../assets/icons/blog-active.svg';
import profileIcon from '../assets/icons/profile.svg';
import profileActive from '../assets/icons/profile-active.svg';


export interface TabItem {
  to: string;
  label: string;
  icon: string; // 비활성(검정)
  iconActive: string; // 활성(초록 #8BCC6A)
  end?: boolean;
}

const DEFAULT_TABS: TabItem[] = [
  { to: ROUTES.home, label: '지도', icon: mapIcon, iconActive: mapActive, end: true },
  { to: ROUTES.timeline, label: '타임라인', icon: timelineIcon, iconActive: timelineActive },
  { to: ROUTES.journey, label: '동선', icon: journeyIcon, iconActive: journeyActive },
  { to: ROUTES.blog, label: '블로그', icon: blogIcon, iconActive: blogActive },
  { to: ROUTES.profile, label: '마이', icon: profileIcon, iconActive: profileActive },
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
                  <img
                    src={isActive ? tab.iconActive : tab.icon}
                    alt=""
                    className="h-6 w-6"
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