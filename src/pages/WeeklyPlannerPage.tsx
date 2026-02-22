import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ListTodo, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AddEventModal } from '@/components/ui/AddEventModal';
import { THEME } from '@/constants';
import type { CalendarEvent } from '@/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Return the Monday of the ISO week that contains `date`. */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // distance to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Seven-day planner view showing tasks and calendar events grouped by date.
 * Week navigation anchors to Monday–Sunday.
 */
export const WeeklyPlannerPage: React.FC = () => {
  const { tasks, calendarEvents, addCalendarEvent } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [addEventDate, setAddEventDate] = useState<string | null>(null);

  const today = new Date();
  const baseMonday = getWeekMonday(today);

  // Shift the base Monday by weekOffset weeks
  const monday = new Date(baseMonday);
  monday.setDate(baseMonday.getDate() + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekLabel = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const handleAddEvent = (event: CalendarEvent) => {
    addCalendarEvent(event);
    setAddEventDate(null);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Weekly Planner
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            {weekLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
            className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronLeft size={20} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[9px] font-black uppercase tracking-widest text-pilot-orange hover:text-white px-3 py-2"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
            className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS.map((day, idx) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + idx);
          const dateStr = d.toISOString().split('T')[0];

          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

          // Tasks due this day; undated tasks appear on Monday of current week only
          const dayTasks = tasks.filter(
            (t) =>
              t.dueDate === dateStr ||
              (idx === 0 && weekOffset === 0 && !t.dueDate)
          );

          // Calendar events for this specific date
          const dayEvents = calendarEvents.filter((e) => e.eventDate === dateStr);

          return (
            <div key={day} className="flex flex-col h-[500px]">
              {/* Day header */}
              <div
                className={`p-4 border-t border-x border-white/5 rounded-t-xl text-center transition-colors ${
                  isToday
                    ? 'bg-pilot-orange/10 border-pilot-orange/30'
                    : 'bg-white/[0.02]'
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                    isToday ? 'text-pilot-orange' : 'text-white/20'
                  }`}
                >
                  {day}
                </span>
                <span
                  className={`text-xl font-black ${
                    isToday ? 'text-pilot-orange' : 'text-white'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 bg-prussianblue/40 border-x border-b border-white/5 rounded-b-xl p-3 space-y-2 overflow-y-auto no-scrollbar shadow-inner flex flex-col">
                {/* Calendar event chips */}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0"
                    title={ev.loc ? `${ev.title} @ ${ev.loc}` : ev.title}
                  >
                    <Clock size={9} className="text-blue-400 shrink-0" />
                    <span className="text-[9px] font-bold text-blue-300 truncate uppercase">
                      {ev.time && (
                        <span className="text-blue-400/60 mr-1">{ev.time}</span>
                      )}
                      {ev.title}
                    </span>
                  </div>
                ))}

                {/* Task list */}
                <div className="flex-1 space-y-2">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        t.isCompleted
                          ? 'bg-white/[0.01] border-white/5 opacity-30'
                          : 'bg-white/[0.03] border-white/10 hover:border-pilot-orange/30 shadow-sm'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold leading-tight uppercase ${
                          t.isCompleted ? 'line-through text-white/30' : 'text-white/70'
                        }`}
                      >
                        {t.title}
                      </span>
                      <div className="mt-2 flex gap-1">
                        <div
                          className={`w-1 h-1 rounded-full ${
                            t.energyRequired === 'High'
                              ? 'bg-pilot-orange'
                              : t.energyRequired === 'Medium'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}

                  {dayTasks.length === 0 && dayEvents.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 pt-4">
                      <ListTodo size={20} />
                    </div>
                  )}
                </div>

                {/* Add event button */}
                <button
                  onClick={() => setAddEventDate(dateStr)}
                  className="shrink-0 w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-pilot-orange hover:bg-pilot-orange/5 rounded-lg transition-all border border-dashed border-white/5 hover:border-pilot-orange/20"
                >
                  + Event
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={addEventDate !== null}
        onClose={() => setAddEventDate(null)}
        defaultDate={addEventDate ?? today.toISOString().slice(0, 10)}
        onSubmit={handleAddEvent}
      />
    </div>
  );
};
