import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AddEventModal } from '@/components/ui/AddEventModal';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import type { CalendarEvent } from '@/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ZONE_COLOR: Record<string, string> = {
  Blue:   'bg-blue-500',
  Green:  'bg-green-500',
  Grey:   'bg-slate-400',
  Yellow: 'bg-yellow-400',
  Red:    'bg-red-500',
};

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const WeeklyPlannerPage: React.FC = () => {
  const { tasks, calendarEvents, addCalendarEvent } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addEventDate, setAddEventDate] = useState<string | null>(null);
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);

  const today = new Date();
  const baseMonday = getWeekMonday(today);
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
    /* Full-height flex column — fills the scrollable content area */
    <div className="flex flex-col h-full min-h-0 gap-4 animate-in fade-in duration-500">

      {/* ── Compact header row ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/30">
          {weekLabel}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-pilot-orange hover:bg-pilot-orange/10 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── 7-column grid — fills remaining height, scrolls horizontally on mobile ── */}
      <div className="flex-1 min-h-0 overflow-x-auto -mx-1 px-1">
      <div className="grid gap-2 flex-1 min-h-0 h-full" style={{ gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))' }}>
        {DAYS.map((day, idx) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + idx);
          const dateStr = d.toISOString().split('T')[0];

          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

          const isPast = d < today && !isToday;

          const dayTasks = tasks.filter(
            (t) =>
              t.dueDate === dateStr ||
              (idx === 0 && weekOffset === 0 && !t.dueDate)
          );
          const dayEvents = calendarEvents.filter((e) => e.eventDate === dateStr);
          const total = dayTasks.length + dayEvents.length;

          return (
            <div
              key={day}
              className={`flex flex-col min-h-0 rounded-2xl border transition-colors ${
                isToday
                  ? 'border-pilot-orange/40 bg-pilot-orange/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {/* Day header */}
              <div
                className={`shrink-0 px-3 pt-4 pb-3 border-b ${
                  isToday ? 'border-pilot-orange/20' : 'border-white/[0.05]'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      isToday ? 'text-pilot-orange' : isPast ? 'text-white/20' : 'text-white/40'
                    }`}
                  >
                    {day}
                  </span>
                  {total > 0 && (
                    <span className={`text-[8px] font-black tabular-nums ${isToday ? 'text-pilot-orange/60' : 'text-white/20'}`}>
                      {total}
                    </span>
                  )}
                </div>
                <span
                  className={`text-2xl font-black leading-none mt-1 block ${
                    isToday
                      ? 'text-pilot-orange'
                      : isPast
                      ? 'text-white/25'
                      : 'text-white'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2 space-y-1.5">

                {/* Events */}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    title={ev.loc ? `${ev.title} @ ${ev.loc}` : ev.title}
                    className="flex items-start gap-1.5 px-2.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/15 group cursor-default"
                  >
                    <Clock size={9} className="text-blue-400/70 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      {ev.time && (
                        <span className="text-[8px] font-bold text-blue-400/50 block leading-none mb-0.5">
                          {ev.time}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-blue-300/80 leading-tight break-words uppercase tracking-wide">
                        {ev.title}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Tasks */}
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`px-2.5 py-2 rounded-xl border transition-all ${
                      t.isCompleted
                        ? 'bg-white/[0.01] border-white/[0.04] opacity-30'
                        : 'bg-white/[0.03] border-white/[0.07] hover:border-pilot-orange/25 hover:bg-pilot-orange/[0.03]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold leading-snug block ${
                        t.isCompleted ? 'line-through text-white/30' : 'text-white/75'
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.zone && !t.isCompleted && (
                      <div className={`w-1 h-1 rounded-full mt-1.5 ${ZONE_COLOR[t.zone] ?? 'bg-white/30'}`} />
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {total === 0 && (
                  <div className="h-full flex items-center justify-center pb-8 opacity-0 group-hover:opacity-100">
                  </div>
                )}
              </div>

              {/* Quick-add row */}
              <div className="shrink-0 border-t border-white/[0.04] grid grid-cols-2">
                <button
                  onClick={() => setAddTaskDate(dateStr)}
                  className="py-2.5 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-pilot-orange hover:bg-pilot-orange/5 transition-all flex items-center justify-center gap-1 rounded-bl-2xl"
                >
                  <Plus size={9} /> Task
                </button>
                <button
                  onClick={() => setAddEventDate(dateStr)}
                  className="py-2.5 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-1 border-l border-white/[0.04] rounded-br-2xl"
                >
                  <Plus size={9} /> Event
                </button>
              </div>
            </div>
          );
        })}
      </div>{/* end grid */}
      </div>{/* end overflow-x-auto */}

      <AddEventModal
        isOpen={addEventDate !== null}
        onClose={() => setAddEventDate(null)}
        defaultDate={addEventDate ?? today.toISOString().slice(0, 10)}
        onSubmit={handleAddEvent}
      />

      <AddTaskModal
        isOpen={addTaskDate !== null}
        onClose={() => setAddTaskDate(null)}
        defaultDueDate={addTaskDate ?? undefined}
      />
    </div>
  );
};
