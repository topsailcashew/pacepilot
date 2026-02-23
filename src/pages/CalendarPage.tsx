import React, { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  MapPin,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AddEventModal } from '@/components/ui/AddEventModal';
import { Modal } from '@/components/ui/Modal';
import { THEME } from '@/constants';
import type { CalendarEvent } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Hours shown in the Day view timeline (6 am – 10 pm) */
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

// ─── Event Details Modal ──────────────────────────────────────────────────────

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onDelete: (ev: CalendarEvent) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onDelete }) => {
  if (!event) return null;

  const displayDate = event.eventDate
    ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <Modal isOpen title={event.title} onClose={onClose}>
      <div className="space-y-5">
        {/* Colour stripe */}
        <div className={`h-1 w-full rounded-full ${event.color ?? 'bg-pilot-orange'}`} />

        {/* Date */}
        <div className="flex items-start gap-3">
          <CalendarDays size={15} className="text-white/30 mt-0.5 shrink-0" />
          <span className="text-sm font-bold text-white/70 uppercase tracking-wide">
            {displayDate}
          </span>
        </div>

        {/* Time */}
        {event.time && (
          <div className="flex items-start gap-3">
            <Clock size={15} className="text-white/30 mt-0.5 shrink-0" />
            <span className="text-sm font-bold text-white/70 uppercase tracking-wide">
              {event.time}
            </span>
          </div>
        )}

        {/* Location */}
        {event.loc && (
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-white/30 mt-0.5 shrink-0" />
            <span className="text-sm font-bold text-white/70 uppercase tracking-wide">
              {event.loc}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className={`${THEME.buttonSecondary} flex-1 py-3 text-xs font-black uppercase tracking-widest`}
          >
            Close
          </button>
          <button
            onClick={() => { onDelete(event); onClose(); }}
            className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Calendar Page ────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'day';

export const CalendarPage: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, addToast } = useAppStore();

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  // Shared state
  const [view, setView]           = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // AddEvent modal
  const [detailEvent, setDetailEvent]   = useState<CalendarEvent | null>(null);

  // Month view
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Day view
  const [dayViewDate, setDayViewDate] = useState(todayIso);

  // ── Month helpers ──────────────────────────────────────────────────────────

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const toIsoDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // ── Day view helpers ───────────────────────────────────────────────────────

  const shiftDay = (delta: number) => {
    const d = new Date(dayViewDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDayViewDate(d.toISOString().slice(0, 10));
  };

  const jumpToDay = (iso: string) => {
    setDayViewDate(iso);
    setView('day');
  };

  const dayEvents = calendarEvents.filter((e) => e.eventDate === dayViewDate);
  const allDayEvents  = dayEvents.filter((e) => !e.time);
  const timedEvents   = dayEvents.filter((e) => !!e.time);

  const eventsAtHour = (hour: number) =>
    timedEvents.filter((e) => {
      const h = parseInt(e.time!.split(':')[0], 10);
      return h === hour;
    });

  // ── Shared handlers ────────────────────────────────────────────────────────

  const openAdd = (iso?: string) =>
    setSelectedDate(iso ?? todayIso);

  const handleAddEvent = (event: CalendarEvent) => {
    addCalendarEvent(event);
    addToast('success', `"${event.title}" added to calendar.`);
    setSelectedDate(null);
  };

  const handleDelete = (ev: CalendarEvent) => {
    deleteCalendarEvent(ev.id);
    addToast('info', `"${ev.title}" removed.`);
  };

  // ── Day view display date ──────────────────────────────────────────────────

  const dayViewDisplay = new Date(dayViewDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isDayViewToday = dayViewDate === todayIso;
  const currentHour = today.getHours();

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Calendar
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Temporal view of commitments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'month'
                  ? 'bg-pilot-orange text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid size={12} /> Month
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'day'
                  ? 'bg-pilot-orange text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <CalendarDays size={12} /> Day
            </button>
          </div>

          <button
            onClick={() => openAdd(view === 'day' ? dayViewDate : todayIso)}
            className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MONTH VIEW                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'month' && (
        <>
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

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            {DAY_NAMES.map((d) => (
              <div key={d} className="bg-deepnavy p-4 text-center border-b border-white/5">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  {d}
                </span>
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`blank-${i}`} className="bg-prussianblue/60 min-h-[120px] border-r border-b border-white/5" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isoDate = toIsoDate(day);
              const dayEvts = calendarEvents.filter((e) => e.eventDate === isoDate);
              const isToday = isCurrentMonth && day === today.getDate();

              return (
                <div
                  key={day}
                  onClick={() => jumpToDay(isoDate)}
                  className={`min-h-[120px] p-3 group cursor-pointer transition-colors relative border-r border-b border-white/5 ${
                    isToday
                      ? 'bg-pilot-orange/5'
                      : 'bg-prussianblue hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-xs font-black ${isToday ? 'text-pilot-orange' : 'text-white/20 group-hover:text-pilot-orange'}`}>
                    {day}
                    {isToday && (
                      <span className="ml-1.5 text-[8px] bg-pilot-orange text-white px-1 rounded uppercase tracking-wider">
                        today
                      </span>
                    )}
                  </span>

                  <div className="mt-1.5 space-y-1">
                    {dayEvts.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}
                        className="flex items-center gap-1 group/ev"
                      >
                        <div
                          className={`flex-1 p-1.5 border-l-2 ${ev.color ?? 'border-pilot-orange'} bg-white/[0.04] rounded text-[8px] font-bold text-white/70 truncate uppercase hover:bg-white/10 transition-colors`}
                          style={{ borderLeftColor: undefined }}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${ev.color ?? 'bg-pilot-orange'}`}
                          />
                          {ev.time && <span className="text-white/40 mr-1">{ev.time}</span>}
                          {ev.title}
                        </div>
                      </div>
                    ))}
                    {dayEvts.length > 3 && (
                      <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">
                        +{dayEvts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DAY VIEW                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'day' && (
        <>
          {/* Day navigation */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => shiftDay(-1)}
              aria-label="Previous day"
              className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center">
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                {dayViewDisplay}
              </h4>
              {!isDayViewToday && (
                <button
                  onClick={() => setDayViewDate(todayIso)}
                  className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white"
                >
                  Back to today
                </button>
              )}
            </div>

            <button
              onClick={() => shiftDay(1)}
              aria-label="Next day"
              className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Timeline */}
          <div className={`${THEME.card} overflow-hidden`}>

            {/* All-day section */}
            {allDayEvents.length > 0 && (
              <div className="flex gap-4 border-b border-white/5 pb-4 mb-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest w-14 shrink-0 pt-1">
                  All day
                </span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {allDayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setDetailEvent(ev)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest text-white/80 transition-all hover:scale-105 ${ev.color ?? 'bg-pilot-orange'} bg-opacity-20 border-current/20`}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly slots */}
            <div className="space-y-0 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
              {TIMELINE_HOURS.map((hour) => {
                const hourEvents = eventsAtHour(hour);
                const isCurrentHour = isDayViewToday && currentHour === hour;
                const label = `${String(hour).padStart(2, '0')}:00`;

                return (
                  <div
                    key={hour}
                    onClick={() => openAdd(dayViewDate)}
                    className={`flex gap-4 min-h-[52px] border-b border-white/5 last:border-0 cursor-pointer transition-colors group ${
                      isCurrentHour ? 'bg-pilot-orange/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Time label */}
                    <span className={`text-[10px] font-black uppercase tracking-widest w-14 shrink-0 pt-3 text-right pr-2 ${
                      isCurrentHour ? 'text-pilot-orange' : 'text-white/20'
                    }`}>
                      {label}
                    </span>

                    {/* Event chips + current time indicator */}
                    <div className="flex-1 py-2 relative">
                      {isCurrentHour && (
                        <div className="absolute left-0 top-0 w-full h-px bg-pilot-orange/50 -translate-y-px" />
                      )}

                      {hourEvents.length > 0 ? (
                        <div className="space-y-1">
                          {hourEvents.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}
                              className={`w-full text-left px-3 py-2 rounded-lg border-l-2 transition-all hover:scale-[1.01] ${
                                ev.color
                                  ? `${ev.color}/20 border-current`
                                  : 'bg-pilot-orange/15 border-pilot-orange'
                              }`}
                            >
                              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate">
                                {ev.title}
                              </p>
                              {ev.loc && (
                                <p className="text-[9px] text-white/30 uppercase mt-0.5 truncate">
                                  {ev.loc}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-pilot-orange/50 uppercase tracking-widest font-black">
                            + Add event
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      <AddEventModal
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        defaultDate={selectedDate ?? todayIso}
        onSubmit={handleAddEvent}
      />

      <EventDetailsModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onDelete={(ev) => { handleDelete(ev); setDetailEvent(null); }}
      />
    </div>
  );
};
