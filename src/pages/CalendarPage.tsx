import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Calendar page showing a static 31-day grid with colour-coded events.
 * Month navigation is a future enhancement.
 */
export const CalendarPage: React.FC = () => {
  const calendarEvents = useAppStore((s) => s.calendarEvents);

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Calendar
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Temporal view of commitments
          </p>
        </div>
        <button
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        {/* Day name headers */}
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="bg-deepnavy p-4 text-center border-b border-white/5"
          >
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              {d}
            </span>
          </div>
        ))}

        {/* Day cells */}
        {DAYS_IN_MONTH.map((day) => {
          const dayEvents = calendarEvents.filter((e) => e.day === day);
          return (
            <div
              key={day}
              className="bg-prussianblue min-h-[140px] p-3 group hover:bg-white/[0.02] transition-colors relative border-r border-b border-white/5"
            >
              <span className="text-xs font-black text-white/20 group-hover:text-pilot-orange">
                {day}
              </span>
              <div className="mt-2 space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-1.5 bg-pilot-orange/10 border-l-2 border-pilot-orange rounded text-[8px] font-bold text-white/70 truncate uppercase"
                    title={`${ev.title} — ${ev.time} @ ${ev.loc}`}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
