import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

/** 하단 탭바. NavLink 로 현재 경로 탭이 자동 활성화됨. */

export interface TabItem {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean; // 지도(홈)처럼 정확 매칭만 활성화할 때 true
}

// 경로는 shared/constants/routes 의 ROUTES 상수를 사용. 아이콘은 확정 시 교체.
const DEFAULT_TABS: TabItem[] = [
  { to: ROUTES.home, label: '지도', icon: '📍', end: true },
  { to: ROUTES.timeline, label: '타임라인', icon: '🕓' },
  { to: ROUTES.journey, label: '동선', icon: '🗺️' },
  { to: ROUTES.blog, label: '블로그', icon: '🗂️' },
  { to: ROUTES.profile, label: '마이', icon: '👤' },
];

type BottomTabBarProps = {
  tabs?: TabItem[];
};

export function BottomTabBar({ tabs = DEFAULT_TABS }: BottomTabBarProps) {
  return (
    <nav className="shrink-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs transition ${
                  isActive ? 'text-pictree-700' : 'text-neutral-400'
                }`
              }
            >
              <span className="text-lg" aria-hidden>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
