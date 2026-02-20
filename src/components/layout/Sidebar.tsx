import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart2,
  Calendar as CalendarIcon,
  Zap,
  RefreshCw,
  CalendarDays,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NAV_ITEMS = [
  { icon: <Home size={20} />, label: 'Workday', path: '/' },
  { icon: <CalendarDays size={20} />, label: 'Planner', path: '/planner' },
  { icon: <Briefcase size={20} />, label: 'Projects', path: '/projects' },
  { icon: <CalendarIcon size={20} />, label: 'Calendar', path: '/calendar' },
  { icon: <RefreshCw size={20} />, label: 'Recurring', path: '/recurring' },
  { icon: <BarChart2 size={20} />, label: 'Insights', path: '/reports' },
];

/**
 * Collapsible navigation sidebar. On large screens it's always visible;
 * on smaller screens it slides in/out as a drawer.
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const user = useAppStore((s) => s.user);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-prussianblue border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-8 border-b border-white/5 bg-deepnavy/50">
          <div className="flex items-center gap-3 text-pilot-orange mb-2">
            <Zap size={24} fill="currentColor" />
            <h1 className="text-xl font-black tracking-tighter text-white uppercase">
              PACE PILOT
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            Productivity Sidekick
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={close}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-pilot-orange/10 text-pilot-orange'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`transition-colors ${
                    isActive
                      ? 'text-pilot-orange'
                      : 'text-white/20 group-hover:text-white/40'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[11px] font-black uppercase tracking-widest ${
                    isActive ? 'text-white' : ''
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pilot-orange shadow-[0_0_8px_rgba(243,115,36,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile shortcut */}
        <div className="p-4 mt-auto border-t border-white/5">
          <Link
            to="/profile"
            onClick={close}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              location.pathname === '/profile'
                ? 'bg-white/5'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-pilot-orange/10 flex items-center justify-center text-pilot-orange border border-pilot-orange/20">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-[11px] font-black text-white uppercase truncate">
                {user?.name || 'Guest'}
              </p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate">
                {user?.streak || 0} Day Streak
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
