import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Bell, Plus, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClock } from '@/hooks/useClock';
import { useAppStore } from '@/store/appStore';
import { computeNotifications } from '@/services/notificationsService';
import { NotificationPanel } from './NotificationPanel';

interface TopBarProps {
  toggleSidebar: () => void;
  onAddTask: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Daily Dashboard',
  '/tasks': 'Tasks',
  '/planner': 'Weekly Planner',
  '/projects': 'Projects',
  '/calendar': 'Calendar',
  '/reports': 'Insights',
  '/mail': 'Mail',
  '/files': 'Files',
  '/profile': 'User Profile',
};

/** Shorter labels for narrow mobile screens */
const ROUTE_TITLES_SHORT: Record<string, string> = {
  '/': 'Dashboard',
  '/planner': 'Planner',
  '/profile': 'Profile',
};

/**
 * Sticky page header containing the live clock, system status, and notification bell.
 * Title updates based on the current route. The bell opens a derived notification panel
 * computed from existing store data (overdue tasks, today's events, habits, report reminder).
 */
export const TopBar: React.FC<TopBarProps> = ({ toggleSidebar, onAddTask }) => {
  const now = useClock();
  const { pathname } = useLocation();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  // Notification state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const bellRef = useRef<HTMLDivElement>(null);

  // Store slices needed for notification computation
  const tasks = useAppStore((s) => s.tasks);
  const calendarEvents = useAppStore((s) => s.calendarEvents);
  const dailyReports = useAppStore((s) => s.dailyReports);

  // Computed notifications — recomputes when store data changes (not every clock tick)
  const notifications = useMemo(
    () => computeNotifications(tasks, calendarEvents, dailyReports, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, calendarEvents, dailyReports]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)).length,
    [notifications, dismissedIds]
  );

  // Close panel on click outside
  useEffect(() => {
    if (!isPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPanelOpen]);

  const handleDismiss = (id: string) =>
    setDismissedIds((prev) => new Set([...prev, id]));

  const handleClearAll = () =>
    setDismissedIds(new Set(notifications.map((n) => n.id)));

  const handleNotificationClick = (href: string) => {
    setIsPanelOpen(false);
    navigate(href);
  };

  const title =
    ROUTE_TITLES[pathname] ??
    (pathname.startsWith('/projects') ? 'Projects' : 'Pace Pilot');

  const titleShort =
    ROUTE_TITLES_SHORT[pathname] ?? title;

  return (
    <header className="flex items-center justify-between mb-6 sm:mb-10 px-2 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — visible only on small screens */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className="lg:hidden shrink-0 p-2 text-white/40 hover:text-white bg-white/5 rounded-lg border border-white/10"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase truncate">
            <span className="sm:hidden">{titleShort}</span>
            <span className="hidden sm:inline">{title}</span>
          </h2>
          <p className="text-[9px] sm:text-[10px] text-white/30 font-bold mt-0.5 uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap">
            {now.toLocaleDateString()} • {now.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Global quick-add task */}
        <button
          onClick={onAddTask}
          aria-label="Add new task"
          title="Add task (anywhere)"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-pilot-orange hover:bg-pilot-orange/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-pilot-orange/20"
        >
          <Plus size={14} /><span className="hidden xs:inline">Task</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="hidden sm:block p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* System status badge */}
        <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            System Ready
          </span>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            onClick={() => setIsPanelOpen((o) => !o)}
            className="text-white/40 hover:text-white transition-colors relative p-1"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-pilot-orange rounded-full border-2 border-deepnavy flex items-center justify-center"
              >
                <span className="text-[9px] font-black text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {isPanelOpen && (
            <NotificationPanel
              notifications={notifications}
              dismissedIds={dismissedIds}
              onDismiss={handleDismiss}
              onClearAll={handleClearAll}
              onNavigate={handleNotificationClick}
            />
          )}
        </div>
      </div>
    </header>
  );
};
