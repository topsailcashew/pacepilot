import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Modal } from '@/components/ui/Modal';
import { THEME } from '@/constants';
import type { CalendarEvent } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EVENT_COLORS = [
  { label: 'Orange', value: 'bg-pilot-orange' },
  { label: 'Blue', value: 'bg-blue-500' },
  { label: 'Green', value: 'bg-green-500' },
  { label: 'Purple', value: 'bg-purple-500' },
  { label: 'Pink', value: 'bg-pink-500' },
];

/**
 * Calendar page with a proper month grid, month navigation,
 * today highlighting, and an Add Event modal.
 */
export const CalendarPage: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, addToast } = useAppStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Month metadata
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const openAdd = (day?: number) => {
    setSelectedDay(day ?? null);
    setAddModalOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      day: Number(fd.get('day')),
      title: (fd.get('title') as string).trim(),
      time: (fd.get('time') as string) || '',
      loc: (fd.get('loc') as string).trim() || '',
      color: (fd.get('color') as string) || 'bg-pilot-orange',
    };
    if (!event.title || !event.day) return;
    addCalendarEvent(event);
    addToast('success', `"${event.title}" added to calendar.`);
    setAddModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    deleteCalendarEvent(ev.id);
    addToast('info', `"${ev.title}" removed.`);
  };

  // Build grid: leading blanks + day cells
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      {/* Header */}
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
          onClick={() => openAdd()}
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <h4 className="text-lg font-black text-white uppercase tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h4>
          {!isCurrentMonth && (
            <button
              onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
              className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white"
            >
              Back to today
            </button>
          )}
        </div>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        {/* Day name headers */}
        {DAY_NAMES.map((d) => (
          <div key={d} className="bg-deepnavy p-4 text-center border-b border-white/5">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              {d}
            </span>
          </div>
        ))}

        {/* Leading blank cells */}
        {blanks.map((i) => (
          <div key={`blank-${i}`} className="bg-prussianblue/60 min-h-[120px] border-r border-b border-white/5" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayEvents = calendarEvents.filter((e) => e.day === day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={day}
              onClick={() => openAdd(day)}
              className={`min-h-[120px] p-3 group cursor-pointer transition-colors relative border-r border-b border-white/5 ${
                isToday
                  ? 'bg-pilot-orange/5 border-b-pilot-orange/20'
                  : 'bg-prussianblue hover:bg-white/[0.02]'
              }`}
            >
              <span
                className={`text-xs font-black ${
                  isToday
                    ? 'text-pilot-orange'
                    : 'text-white/20 group-hover:text-pilot-orange'
                }`}
              >
                {day}
                {isToday && (
                  <span className="ml-1.5 text-[8px] bg-pilot-orange text-white px-1 rounded uppercase tracking-wider">
                    today
                  </span>
                )}
              </span>
              <div className="mt-1.5 space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 group/ev"
                  >
                    <div
                      className="flex-1 p-1.5 bg-pilot-orange/10 border-l-2 border-pilot-orange rounded text-[8px] font-bold text-white/70 truncate uppercase"
                      style={{}}
                      title={`${ev.title}${ev.time ? ` — ${ev.time}` : ''}${ev.loc ? ` @ ${ev.loc}` : ''}`}
                    >
                      {ev.title}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, ev)}
                      aria-label={`Delete ${ev.title}`}
                      className="opacity-0 group-hover/ev:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Event">
        <form onSubmit={handleAddEvent} className="space-y-5">
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="ev-title">Event Title</label>
            <input
              id="ev-title"
              name="title"
              type="text"
              required
              className={`${THEME.input} w-full`}
              placeholder="E.G. TEAM SYNC"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="ev-day">Day</label>
              <input
                id="ev-day"
                name="day"
                type="number"
                required
                min={1}
                max={daysInMonth}
                defaultValue={selectedDay ?? ''}
                className={`${THEME.input} w-full`}
                placeholder="1–31"
              />
            </div>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="ev-time">Time</label>
              <input
                id="ev-time"
                name="time"
                type="time"
                className={`${THEME.input} w-full`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="ev-loc">Location</label>
            <input
              id="ev-loc"
              name="loc"
              type="text"
              className={`${THEME.input} w-full`}
              placeholder="E.G. CONFERENCE ROOM A"
            />
          </div>

          <div className="space-y-2">
            <label className={THEME.label}>Color</label>
            <div className="flex gap-3">
              {EVENT_COLORS.map((c) => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="color" value={c.value} className="sr-only" defaultChecked={c.value === 'bg-pilot-orange'} />
                  <div className={`w-7 h-7 rounded-full ${c.value} ring-2 ring-transparent has-[:checked]:ring-white ring-offset-2 ring-offset-deepnavy`} />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className={`${THEME.buttonPrimary} flex-1 py-3 text-xs font-black uppercase tracking-widest`}
            >
              Add Event
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest`}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
