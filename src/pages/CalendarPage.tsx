import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  MapPin,
  CalendarDays,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { listGoogleCalendars } from '@/services/googleCalendarService';
import type { GoogleCalendarMeta } from '@/services/googleCalendarService';
import { AddEventModal } from '@/components/ui/AddEventModal';
import { Modal } from '@/components/ui/Modal';
import { THEME } from '@/constants';
import type { CalendarEvent } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Hours shown in timeline views (6 am – 10 pm) */
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/** Returns Monday-anchored week start for the given ISO date */
function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

function formatHeader(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatNavTitle(dates: string[]): string {
  const a = new Date(dates[0] + 'T00:00:00');
  const b = new Date(dates[dates.length - 1] + 'T00:00:00');
  const mo = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  if (a.getMonth() === b.getMonth()) {
    return `${mo(a)} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
  }
  return `${mo(a)} ${a.getDate()} – ${mo(b)} ${b.getDate()}, ${a.getFullYear()}`;
}

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
        <div className={`h-1 w-full rounded-full ${event.color ?? 'bg-pilot-orange'}`} />
        <div className="flex items-start gap-3">
          <CalendarDays size={15} className="text-white/30 mt-0.5 shrink-0" />
          <span className="text-sm font-bold text-white/70 uppercase tracking-wide">{displayDate}</span>
        </div>
        {event.time && (
          <div className="flex items-start gap-3">
            <Clock size={15} className="text-white/30 mt-0.5 shrink-0" />
            <span className="text-sm font-bold text-white/70 uppercase tracking-wide">{event.time}</span>
          </div>
        )}
        {event.loc && (
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-white/30 mt-0.5 shrink-0" />
            <span className="text-sm font-bold text-white/70 uppercase tracking-wide">{event.loc}</span>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className={`${THEME.buttonSecondary} flex-1 py-3 text-xs font-black uppercase tracking-widest`}>Close</button>
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

// ─── Multi-Day Timeline View (shared for Week + 4-Day) ───────────────────────

interface MultiDayViewProps {
  dates: string[];           // ISO strings for each column
  todayIso: string;
  calendarEvents: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onSlotClick: (iso: string) => void;
}

const MultiDayView: React.FC<MultiDayViewProps> = ({
  dates,
  todayIso,
  calendarEvents,
  onEventClick,
  onSlotClick,
}) => {
  const currentHour = new Date().getHours();
  const colWidth = dates.length <= 4 ? 'min-w-[160px]' : 'min-w-[110px]';

  return (
    <div className={`${THEME.card} overflow-hidden p-0`}>
      {/* Horizontally scrollable on mobile so columns don't get crushed */}
      <div className="overflow-x-auto">
      {/* Day header row */}
      <div className="flex border-b border-white/5 mb-0" style={{ minWidth: dates.length <= 4 ? `${dates.length * 160 + 56}px` : `${dates.length * 110 + 56}px` }}>
        {/* Time gutter */}
        <div className="w-14 shrink-0" />
        {dates.map((iso) => {
          const d = new Date(iso + 'T00:00:00');
          const isToday = iso === todayIso;
          return (
            <div key={iso} className={`flex-1 ${colWidth} text-center py-3 border-l border-white/5 ${isToday ? 'bg-pilot-orange/5' : ''}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-pilot-orange' : 'text-white/30'}`}>
                {DAY_NAMES[d.getDay()]}
              </p>
              <p className={`text-lg font-black leading-tight ${isToday ? 'text-pilot-orange' : 'text-white/60'}`}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {dates.some((iso) => calendarEvents.some((e) => e.eventDate === iso && !e.time)) && (
        <div className="flex border-b border-white/5 bg-white/[0.01]" style={{ minWidth: dates.length <= 4 ? `${dates.length * 160 + 56}px` : `${dates.length * 110 + 56}px` }}>
          <div className="w-14 shrink-0 flex items-center justify-end pr-2">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">All day</span>
          </div>
          {dates.map((iso) => {
            const allDay = calendarEvents.filter((e) => e.eventDate === iso && !e.time);
            return (
              <div key={iso} className={`flex-1 ${colWidth} border-l border-white/5 py-1 px-1 space-y-0.5`}>
                {allDay.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className={`w-full text-left px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest truncate ${ev.color ?? 'bg-pilot-orange/20'} text-white/70 hover:brightness-125 transition-all`}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Hourly grid */}
      <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
        {TIMELINE_HOURS.map((hour) => {
          const label = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div key={hour} className="flex border-b border-white/5 last:border-0 min-h-[52px]" style={{ minWidth: dates.length <= 4 ? `${dates.length * 160 + 56}px` : `${dates.length * 110 + 56}px` }}>
              {/* Time label */}
              <div className="w-14 shrink-0 pt-2 text-right pr-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  dates.includes(todayIso) && currentHour === hour ? 'text-pilot-orange' : 'text-white/20'
                }`}>
                  {label}
                </span>
              </div>

              {/* Per-day cells */}
              {dates.map((iso) => {
                const isToday = iso === todayIso;
                const isCurrentHour = isToday && currentHour === hour;
                const hourEvts = calendarEvents.filter((e) => {
                  if (e.eventDate !== iso || !e.time) return false;
                  return parseInt(e.time.split(':')[0], 10) === hour;
                });

                return (
                  <div
                    key={iso}
                    onClick={() => onSlotClick(iso)}
                    className={`flex-1 ${colWidth} border-l border-white/5 py-1 px-1 relative cursor-pointer group transition-colors ${
                      isCurrentHour ? 'bg-pilot-orange/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {isCurrentHour && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-pilot-orange/50" />
                    )}
                    {hourEvts.length > 0 ? (
                      <div className="space-y-0.5">
                        {hourEvts.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                            className={`w-full text-left px-2 py-1.5 rounded border-l-2 text-[8px] font-black uppercase tracking-widest truncate transition-all hover:scale-[1.02] ${
                              ev.color ? `${ev.color}/15 border-current` : 'bg-pilot-orange/15 border-pilot-orange'
                            } text-white/70`}
                          >
                            {ev.title}
                            {ev.loc && <span className="block text-[7px] text-white/30 normal-case font-normal mt-0.5 truncate">{ev.loc}</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-pilot-orange/40 uppercase tracking-widest font-black">+ Add</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      </div> {/* end overflow-x-auto */}
    </div>
  );
};

// ─── Calendar Page ────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | '4day' | 'day';

const VIEW_CONFIG: { id: ViewMode; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week',  label: 'Week'  },
  { id: '4day',  label: '4 Days'},
  { id: 'day',   label: 'Day'   },
];

export const CalendarPage: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, addToast, googleAccessToken } = useAppStore();

  // ── Subscribed Google Calendars ────────────────────────────────────────────
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarMeta[]>([]);
  const [calListLoading, setCalListLoading] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(new Set());

  const toggleCalendarVisibility = (calId: string) => {
    setHiddenCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(calId)) next.delete(calId); else next.add(calId);
      return next;
    });
  };

  const loadCalendars = async () => {
    if (!googleAccessToken) return;
    setCalListLoading(true);
    try {
      const list = await listGoogleCalendars(googleAccessToken);
      setGoogleCalendars(list);
    } catch (err) {
      console.error('[CalendarPage] listGoogleCalendars:', err);
    } finally {
      setCalListLoading(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) loadCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleAccessToken]);

  const today = new Date();
  const todayIso = isoDate(today);

  const [view, setView]           = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailEvent, setDetailEvent]   = useState<CalendarEvent | null>(null);

  // Month view
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Day / multi-day anchor date
  const [anchorDate, setAnchorDate] = useState(todayIso);

  // ── Week dates ─────────────────────────────────────────────────────────────
  const weekDates = useMemo(() => {
    const start = weekStart(anchorDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchorDate]);

  // ── 4-day dates ────────────────────────────────────────────────────────────
  const fourDayDates = useMemo(
    () => Array.from({ length: 4 }, (_, i) => addDays(anchorDate, i)),
    [anchorDate]
  );

  // ── Month helpers ──────────────────────────────────────────────────────────
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1);
  const toIsoDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // ── Shared navigation ──────────────────────────────────────────────────────
  function shiftAnchor(delta: number) {
    setAnchorDate((prev) => addDays(prev, delta));
  }

  const navDelta = view === 'week' ? 7 : view === '4day' ? 4 : 1;

  const navTitle = useMemo(() => {
    if (view === 'week') return formatNavTitle(weekDates);
    if (view === '4day') return formatNavTitle(fourDayDates);
    if (view === 'day') {
      return new Date(anchorDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    }
    return `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  }, [view, weekDates, fourDayDates, anchorDate, viewMonth, viewYear]);

  // ── Jump from month cell ───────────────────────────────────────────────────
  const jumpToDay = (iso: string) => {
    setAnchorDate(iso);
    setView('day');
  };

  // ── Filter events by toggled calendars ───────────────────────────────────
  const visibleEvents = useMemo(() => {
    if (hiddenCalendars.size === 0) return calendarEvents;
    return calendarEvents.filter((e) => {
      // Pure local events (no Google origin) always show
      if (!e.googleEventId && !e.googleCalendarId) return true;
      // Google events with a known calendarId: hide if that calendar is toggled off
      if (e.googleCalendarId) return !hiddenCalendars.has(e.googleCalendarId);
      // Google events with unknown calendarId: hide when all calendars are hidden
      return hiddenCalendars.size < googleCalendars.length;
    });
  }, [calendarEvents, hiddenCalendars, googleCalendars.length]);

  // ── Day view (single) ──────────────────────────────────────────────────────
  const dayEvents    = visibleEvents.filter((e) => e.eventDate === anchorDate);
  const allDayEvents = dayEvents.filter((e) => !e.time);
  const timedEvents  = dayEvents.filter((e) => !!e.time);
  const eventsAtHour = (hour: number) =>
    timedEvents.filter((e) => parseInt(e.time!.split(':')[0], 10) === hour);
  const currentHour = today.getHours();
  const isDayViewToday = anchorDate === todayIso;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd = (iso?: string) => setSelectedDate(iso ?? anchorDate);

  const handleAddEvent = (event: CalendarEvent) => {
    addCalendarEvent(event);
    addToast('success', `"${event.title}" added to calendar.`);
    setSelectedDate(null);
  };

  const handleDelete = (ev: CalendarEvent) => {
    deleteCalendarEvent(ev.id);
    addToast('info', `"${ev.title}" removed.`);
  };

  const isMultiDay = view === 'week' || view === '4day';

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-2">
        {/* View toggle — fills available width, each tab equal */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden flex-1">
          {VIEW_CONFIG.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                view === id ? 'bg-pilot-orange text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              {id === 'month' && <LayoutGrid size={10} className="shrink-0" />}
              {id === 'week'  && <CalendarDays size={10} className="shrink-0" />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">
                {id === 'month' ? 'Mo' : id === 'week' ? 'Wk' : id === '4day' ? '4D' : 'Day'}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => openAdd(view === 'day' ? anchorDate : todayIso)}
          className={`${THEME.buttonPrimary} px-3 sm:px-6 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0`}
        >
          <Plus size={14} /><span className="hidden xs:inline">Add Event</span>
        </button>
      </div>

      {/* ── Subscribed Google Calendars — toggle strip ─────────────────────── */}
      {googleAccessToken && googleCalendars.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          {googleCalendars.map((cal) => {
            const hidden = hiddenCalendars.has(cal.id);
            return (
              <button
                key={cal.id}
                onClick={() => toggleCalendarVisibility(cal.id)}
                title={hidden ? `Show ${cal.summary}` : `Hide ${cal.summary}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                  hidden
                    ? 'border-white/5 bg-transparent text-white/20 line-through'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                  style={{
                    backgroundColor: cal.backgroundColor ?? '#f37324',
                    opacity: hidden ? 0.3 : 1,
                  }}
                />
                {cal.summary}
              </button>
            );
          })}
          <button
            onClick={loadCalendars}
            disabled={calListLoading}
            title="Refresh"
            className="p-1.5 rounded-full text-white/20 hover:text-white transition-colors"
          >
            <RefreshCw size={11} className={calListLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* ── Shared Nav Bar (all non-month views) ───────────────────────────── */}
      {view !== 'month' && (
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => shiftAnchor(-navDelta)}
            aria-label="Previous"
            className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <h4 className="text-base font-black text-white uppercase tracking-tight">{navTitle}</h4>
            {anchorDate !== todayIso && (
              <button
                onClick={() => setAnchorDate(todayIso)}
                className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white"
              >
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={() => shiftAnchor(navDelta)}
            aria-label="Next"
            className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MONTH VIEW                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'month' && (
        <>
          <div className="flex items-center justify-between px-2">
            <button onClick={prevMonth} aria-label="Previous month" className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}>
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
            <button onClick={nextMonth} aria-label="Next month" className={`${THEME.buttonSecondary} p-2 rounded-lg text-white/40 hover:text-white`}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            {DAY_NAMES.map((d) => (
              <div key={d} className="bg-deepnavy p-4 text-center border-b border-white/5">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{d}</span>
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`blank-${i}`} className="bg-prussianblue/60 min-h-[120px] border-r border-b border-white/5" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const iso = toIsoDate(day);
              const dayEvts = visibleEvents.filter((e) => e.eventDate === iso);
              const isToday = isCurrentMonth && day === today.getDate();
              return (
                <div
                  key={day}
                  onClick={() => jumpToDay(iso)}
                  className={`min-h-[120px] p-3 group cursor-pointer transition-colors relative border-r border-b border-white/5 ${
                    isToday ? 'bg-pilot-orange/5' : 'bg-prussianblue hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-xs font-black ${isToday ? 'text-pilot-orange' : 'text-white/20 group-hover:text-pilot-orange'}`}>
                    {day}
                    {isToday && <span className="ml-1.5 text-[8px] bg-pilot-orange text-white px-1 rounded uppercase tracking-wider">today</span>}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {dayEvts.slice(0, 3).map((ev) => (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }} className="flex items-center gap-1">
                        <div className="flex-1 p-1.5 bg-white/[0.04] rounded text-[8px] font-bold text-white/70 truncate uppercase hover:bg-white/10 transition-colors">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${ev.color ?? 'bg-pilot-orange'}`} />
                          {ev.time && <span className="text-white/40 mr-1">{ev.time}</span>}
                          {ev.title}
                        </div>
                      </div>
                    ))}
                    {dayEvts.length > 3 && (
                      <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">+{dayEvts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* WEEK VIEW                                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'week' && (
        <MultiDayView
          dates={weekDates}
          todayIso={todayIso}
          calendarEvents={visibleEvents}
          onEventClick={setDetailEvent}
          onSlotClick={openAdd}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 4-DAY VIEW                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === '4day' && (
        <MultiDayView
          dates={fourDayDates}
          todayIso={todayIso}
          calendarEvents={visibleEvents}
          onEventClick={setDetailEvent}
          onSlotClick={openAdd}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DAY VIEW                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'day' && (
        <div className={`${THEME.card} overflow-hidden`}>
          {allDayEvents.length > 0 && (
            <div className="flex gap-4 border-b border-white/5 pb-4 mb-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest w-14 shrink-0 pt-1">All day</span>
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

          <div className="space-y-0 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
            {TIMELINE_HOURS.map((hour) => {
              const hourEvents = eventsAtHour(hour);
              const isCurrentHour = isDayViewToday && currentHour === hour;
              const label = `${String(hour).padStart(2, '0')}:00`;
              return (
                <div
                  key={hour}
                  onClick={() => openAdd(anchorDate)}
                  className={`flex gap-4 min-h-[52px] border-b border-white/5 last:border-0 cursor-pointer transition-colors group ${
                    isCurrentHour ? 'bg-pilot-orange/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest w-14 shrink-0 pt-3 text-right pr-2 ${
                    isCurrentHour ? 'text-pilot-orange' : 'text-white/20'
                  }`}>
                    {label}
                  </span>
                  <div className="flex-1 py-2 relative">
                    {isCurrentHour && <div className="absolute left-0 top-0 w-full h-px bg-pilot-orange/50 -translate-y-px" />}
                    {hourEvents.length > 0 ? (
                      <div className="space-y-1">
                        {hourEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}
                            className={`w-full text-left px-3 py-2 rounded-lg border-l-2 transition-all hover:scale-[1.01] ${
                              ev.color ? `${ev.color}/20 border-current` : 'bg-pilot-orange/15 border-pilot-orange'
                            }`}
                          >
                            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate">{ev.title}</p>
                            {ev.loc && <p className="text-[9px] text-white/30 uppercase mt-0.5 truncate">{ev.loc}</p>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-pilot-orange/50 uppercase tracking-widest font-black">+ Add event</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
