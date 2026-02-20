import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useClock } from '@/hooks/useClock';

interface TopBarProps {
  toggleSidebar: () => void;
}

/**
 * Sticky page header containing the live clock, system status, and notification bell.
 */
export const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const now = useClock();

  return (
    <header className="flex items-center justify-between mb-10 px-2 shrink-0">
      <div className="flex items-center gap-4">
        {/* Hamburger — visible only on small screens */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className="lg:hidden p-2 text-white/40 hover:text-white bg-white/5 rounded-lg border border-white/10"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Daily Dashboard
          </h2>
          <p className="text-[10px] text-white/30 font-bold mt-1 uppercase tracking-[0.2em]">
            {now.toLocaleDateString()} • {now.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* System status badge */}
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            System Ready
          </span>
        </div>

        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="text-white/20 hover:text-white transition-colors relative"
        >
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-pilot-orange rounded-full border-2 border-deepnavy" />
        </button>
      </div>
    </header>
  );
};
