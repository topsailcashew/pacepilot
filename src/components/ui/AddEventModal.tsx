import React from 'react';
import { Modal } from './Modal';
import { THEME } from '@/constants';
import type { CalendarEvent } from '@/types';

const EVENT_COLORS = [
  { label: 'Orange', value: 'bg-pilot-orange' },
  { label: 'Blue', value: 'bg-blue-500' },
  { label: 'Green', value: 'bg-green-500' },
  { label: 'Purple', value: 'bg-purple-500' },
  { label: 'Pink', value: 'bg-pink-500' },
];

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** ISO date "YYYY-MM-DD" — pre-fills and locks the event date */
  defaultDate: string;
  onSubmit: (event: CalendarEvent) => void;
}

/**
 * Shared modal for adding a calendar event.
 * Used by CalendarPage (click a day cell) and WeeklyPlannerPage (click "＋ Event").
 * The date is derived from `defaultDate` — not editable by the user.
 */
export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string).trim();
    if (!title) return;

    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      eventDate: defaultDate,
      title,
      time: (fd.get('time') as string) || '',
      loc: (fd.get('loc') as string).trim() || '',
      color: (fd.get('color') as string) || 'bg-pilot-orange',
    };

    onSubmit(event);
    (e.target as HTMLFormElement).reset();
  };

  // Format the date for display: "Mon Feb 22"
  const displayDate = defaultDate
    ? new Date(defaultDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Event">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date display (read-only) */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg">
          <span className={THEME.label}>Date</span>
          <span className="text-sm font-bold text-white/60 uppercase tracking-wider">
            {displayDate}
          </span>
        </div>

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
            <label className={THEME.label} htmlFor="ev-time">Time</label>
            <input
              id="ev-time"
              name="time"
              type="time"
              className={`${THEME.input} w-full`}
            />
          </div>
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="ev-loc">Location</label>
            <input
              id="ev-loc"
              name="loc"
              type="text"
              className={`${THEME.input} w-full`}
              placeholder="OPTIONAL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={THEME.label}>Color</label>
          <div className="flex gap-3">
            {EVENT_COLORS.map((c) => (
              <label key={c.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c.value}
                  className="sr-only"
                  defaultChecked={c.value === 'bg-pilot-orange'}
                />
                <div
                  className={`w-7 h-7 rounded-full ${c.value} ring-2 ring-transparent has-[:checked]:ring-white ring-offset-2 ring-offset-deepnavy`}
                />
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
            onClick={onClose}
            className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest`}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
