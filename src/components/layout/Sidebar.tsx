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
  Mail,
  User as UserIcon,
  CheckSquare,
  HardDrive,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AmbianceMiniPlayer } from '@/components/audio/AmbiancePlayer';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface NavSection {
  label?: string; // undefined = no section header
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { icon: <Home size={18} />, label: 'Workday', path: '/' },
    ],
  },
  {
    label: 'Work',
    items: [
      { icon: <CheckSquare size={18} />, label: 'Tasks',    path: '/tasks'    },
      { icon: <Briefcase   size={18} />, label: 'Projects', path: '/projects' },
      { icon: <HardDrive   size={18} />, label: 'Files',    path: '/files'    },
    ],
  },
  {
    label: 'Plan',
    items: [
      { icon: <CalendarDays size={18} />, label: 'Planner',   path: '/planner'   },
      { icon: <CalendarIcon size={18} />, label: 'Calendar',  path: '/calendar'  },
      { icon: <RefreshCw   size={18} />, label: 'Recurring', path: '/recurring' },
    ],
  },
  {
    label: 'Review',
    items: [
      { icon: <BarChart2 size={18} />, label: 'Insights', path: '/reports' },
      { icon: <Mail      size={18} />, label: 'Mail',     path: '/mail'    },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const user = useAppStore((s) => s.user);

  const close = () => setIsOpen(false);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-prussianblue border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/5 bg-deepnavy/50 shrink-0">
          <div className="flex items-center gap-3 text-pilot-orange mb-1">
            <Zap size={22} fill="currentColor" />
            <h1 className="text-lg font-black tracking-tighter text-white uppercase">
              Pace Pilot
            </h1>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
            Productivity Sidekick
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 py-6 px-3 space-y-5 overflow-y-auto no-scrollbar"
          aria-label="Main navigation"
        >
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="space-y-1">
              {/* Section label */}
              {section.label && (
                <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-[0.25em] text-white/20">
                  {section.label}
                </p>
              )}

              {/* Items */}
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      active
                        ? 'bg-pilot-orange/10 text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`transition-colors shrink-0 ${
                      active ? 'text-pilot-orange' : 'text-white/20 group-hover:text-white/40'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest flex-1">
                      {item.label}
                    </span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pilot-orange shadow-[0_0_8px_rgba(243,115,36,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Ambiance mini-player — only shown when something is playing */}
        <div className="px-3 pb-2 shrink-0">
          <AmbianceMiniPlayer />
        </div>

        {/* User profile shortcut */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <Link
            to="/profile"
            onClick={close}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              location.pathname === '/profile' ? 'bg-white/5' : 'hover:bg-white/5'
            }`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-pilot-orange/10 flex items-center justify-center text-pilot-orange border border-pilot-orange/20 shrink-0">
                <UserIcon size={18} />
              </div>
            )}
            <div className="flex-1 overflow-hidden text-left min-w-0">
              <p className="text-[11px] font-black text-white uppercase truncate">
                {user?.name || 'Guest'}
              </p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                {user?.streak || 0} day streak
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
