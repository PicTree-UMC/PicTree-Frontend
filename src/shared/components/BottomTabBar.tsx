import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

/** 하단 탭바. NavLink 로 현재 경로 탭이 자동 활성화됨. */

export interface TabItem {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean; // '/'(지도)처럼 정확 매칭만 활성화할 때 true
}

// 탭 구성의 기준값. 라우트/아이콘 확정 시 이 배열만 수정
const DEFAULT_TABS: TabItem[] = [
  { to: '/', label: '지도', icon: '📍', end: true },
  { to: '/timeline', label: '타임라인', icon: '🕓' },
  { to: '/journey', label: '동선', icon: '🗺️' },
  { to: '/blog', label: '블로그', icon: '🗂️' },
  { to: '/mypage', label: '마이', icon: '👤' },
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
