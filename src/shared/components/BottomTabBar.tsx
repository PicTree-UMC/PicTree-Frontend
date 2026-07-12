import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export type TabItem = {
  to: string;
  label: string;
  icon?: React.ReactNode;
  end?: boolean;
};

const tabs = [
  { to: ROUTES.home, label: '지도', icon: 'pin', end: true },
  { to: ROUTES.timeline, label: '타임라인', icon: 'calendar' },
  { to: ROUTES.journey, label: '동선', icon: 'map' },
  { to: ROUTES.blog, label: '블로그', icon: 'blog' },
  { to: ROUTES.profile, label: '마이', icon: 'user' },
];

export function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[86px] max-w-[390px] rounded-t-[24px] bg-white shadow-[0_-4px_18px_rgba(55,60,42,0.08)]">
      <ul className="flex h-full items-center justify-around px-3 pb-1">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink to={tab.to} end={tab.end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-bold ${isActive ? 'text-[#304238]' : 'text-[#657269]'}`}>
              <TabIcon name={tab.icon} />
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TabIcon({ name }: { name: string }) {
  const common = { width: 30, height: 30, viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 2.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'pin') return <svg {...common}><path d="M26 13c0 7-10 14-10 14S6 20 6 13a10 10 0 1 1 20 0Z"/><circle cx="16" cy="13" r="3.5"/></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="4" y="6" width="22" height="20" rx="3"/><path d="M9 3v6m12-6v6M4 12h22"/><circle cx="22" cy="23" r="5" fill="white"/><path d="M22 20v3l2 1"/></svg>;
  if (name === 'map') return <svg {...common}><path d="m4 8 7-4 10 4 7-4v20l-7 4-10-4-7 4V8Zm7-4v20M21 8v20m-7-13 4 4m0-4-4 4"/></svg>;
  if (name === 'blog') return <svg {...common}><rect x="8" y="4" width="18" height="23" rx="3" transform="rotate(14 8 4)"/><path d="m13 10 7 2m-8 4 7 2"/><path d="M8 11 4 12v13c0 2 1 3 3 3h9"/></svg>;
  return <svg {...common}><circle cx="16" cy="10" r="5"/><path d="M6 28v-4c0-6 4-9 10-9s10 3 10 9v4H6Z"/></svg>;
}
