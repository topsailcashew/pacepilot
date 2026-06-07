/**
 * usePushNotifications
 *
 * Requests browser notification permission once on mount, then checks every
 * minute for events you need to know about and fires native push notifications.
 *
 * Fires for:
 *  • Calendar events starting in 10–15 minutes
 *  • Overdue tasks (once per calendar day)
 *  • Recurring tasks that are still pending (once per day at 8 am+)
 */

import { useEffect, useRef } from 'react';
import type { Task, CalendarEvent, RecurringTask } from '@/types';

function canNotify(): boolean {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted';
}

function push(title: string, body: string) {
  if (!canNotify()) return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: title, // prevents duplicate toasts for the same key
      silent: false,
    });
  } catch {
    // Some browsers block Notification outside HTTPS — fail silently
  }
}

export function usePushNotifications(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  recurringTasks: RecurringTask[],
) {
  const sentRef = useRef<Set<string>>(new Set());

  // ── Request permission once ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {/* silently fail */});
    }
  }, []);

  // ── Periodic check ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (!canNotify()) return;

      const now = new Date();
      const todayIso = now.toISOString().split('T')[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();

      // 1. Events starting in 10–15 minutes
      calendarEvents
        .filter((e) => e.eventDate === todayIso && e.time)
        .forEach((e) => {
          const [h, m] = e.time!.split(':').map(Number);
          const eventMins = h * 60 + m;
          const diff = eventMins - nowMins;
          // Fire once per 15-minute window so we don't spam
          const windowKey = `event-soon-${e.id}-${Math.floor(nowMins / 15)}`;
          if (diff >= 10 && diff <= 15 && !sentRef.current.has(windowKey)) {
            sentRef.current.add(windowKey);
            push(
              `📅 Starting soon — ${e.title}`,
              `In ${diff} minutes${e.loc ? ` · ${e.loc}` : ''}`,
            );
          }
        });

      // 2. Overdue tasks — once per day at any hour
      const overdueKey = `overdue-${todayIso}`;
      if (!sentRef.current.has(overdueKey)) {
        const overdue = tasks.filter(
          (t) => !t.isCompleted && t.dueDate && t.dueDate < todayIso,
        );
        if (overdue.length > 0) {
          sentRef.current.add(overdueKey);
          push(
            `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
            overdue.length === 1
              ? `"${overdue[0].title}" is past its due date`
              : `${overdue.map((t) => `"${t.title}"`).slice(0, 2).join(', ')}${overdue.length > 2 ? ` +${overdue.length - 2} more` : ''} are overdue`,
          );
        }
      }

      // 3. Recurring tasks pending — once per day after 8 am
      const recurringKey = `recurring-${todayIso}`;
      if (!sentRef.current.has(recurringKey) && now.getHours() >= 8) {
        const pending = recurringTasks.filter((rt) => rt.status !== 'Completed');
        if (pending.length > 0) {
          sentRef.current.add(recurringKey);
          push(
            `🔄 ${pending.length} recurring task${pending.length > 1 ? 's' : ''} pending`,
            pending.length === 1
              ? `"${pending[0].task}" is due (${pending[0].interval})`
              : `Including "${pending[0].task}" and ${pending.length - 1} more`,
          );
        }
      }
    };

    check(); // immediate check on mount / data change
    const id = setInterval(check, 60_000); // then every 60 s
    return () => clearInterval(id);
  }, [tasks, calendarEvents, recurringTasks]);
}
