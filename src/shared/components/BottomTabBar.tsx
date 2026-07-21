import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import blogActiveIcon from '../assets/icons/nav-blog-active.svg';
import blogIcon from '../assets/icons/nav-blog.svg';
import journeyActiveIcon from '../assets/icons/nav-journey-active.svg';
import journeyIcon from '../assets/icons/nav-journey.svg';
import mapActiveIcon from '../assets/icons/nav-map-active.svg';
import mapIcon from '../assets/icons/nav-map.svg';
import profileActiveIcon from '../assets/icons/nav-profile-active.svg';
import profileIcon from '../assets/icons/nav-profile.svg';
import timelineActiveIcon from '../assets/icons/nav-timeline-active.svg';
import timelineIcon from '../assets/icons/nav-timeline.svg';
import { ROUTES } from '../constants/routes';

export type TabItem = {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean;
};

type NavigationTab = Omit<TabItem, 'icon'> & {
  icon: string;
  activeIcon: string;
};

const tabs: NavigationTab[] = [
  { to: ROUTES.home, label: '지도', icon: mapIcon, activeIcon: mapActiveIcon, end: true },
  { to: ROUTES.timeline, label: '타임라인', icon: timelineIcon, activeIcon: timelineActiveIcon },
  { to: ROUTES.journey, label: '동선', icon: journeyIcon, activeIcon: journeyActiveIcon },
  { to: ROUTES.blog, label: '블로그', icon: blogIcon, activeIcon: blogActiveIcon },
  { to: ROUTES.profile, label: '마이', icon: profileIcon, activeIcon: profileActiveIcon },
];

export function BottomTabBar() {
  return (
    <nav className="z-40 h-[86px] w-full shrink-0 rounded-t-[24px] bg-white shadow-[0_-4px_18px_rgba(55,60,42,0.08)]">
      <ul className="flex h-full items-center justify-around px-3 pb-1">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${isActive ? 'text-[#5C6F2B]' : 'text-[#2C3930]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <img className="h-9 w-9" src={isActive ? tab.activeIcon : tab.icon} alt="" aria-hidden />
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
