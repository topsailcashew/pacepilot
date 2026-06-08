/**
 * notificationsService.ts
 *
 * Pure, synchronous computation of in-app notifications from existing store data.
 * No Appwrite calls, no React, no persistence — notifications are derived on every
 * render and dismissed state lives in TopBar component memory only.
 */

import type {
  Task,
  CalendarEvent,
  DailyReport,
  AppNotification,
} from '@/types';

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute all active notifications from the current store state.
 * Returns notifications in priority order:
 *   1. Overdue tasks (most urgent)
 *   2. Today's calendar events (time-sensitive)
 *   3. Daily report reminder (lowest urgency, only after 3pm)
 */
export function computeNotifications(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  dailyReports: DailyReport[],
  now: Date
): AppNotification[] {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = now.toISOString().split('T')[0];

  // 1. Overdue tasks — mirrors insightsService.ts overdue logic exactly
  const overdueNotifications: AppNotification[] = tasks
    .filter((t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < todayStart)
    .map((t) => ({
      id: `overdue-${t.id}`,
      type: 'overdue_task' as const,
      title: t.title,
      subtitle: `Due ${new Date(t.dueDate!).toLocaleDateString()}`,
      href: '/',
    }));

  // 2. Today's calendar events — imminent (≤30 min away) shown first, rest after
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const eventNotifications: AppNotification[] = calendarEvents
    .filter((e) => e.eventDate === todayIso)
    .map((e) => {
      const minsUntil = e.time
        ? (() => {
            const [h, m] = e.time!.split(':').map(Number);
            return h * 60 + m - nowMins;
          })()
        : null;

      const imminentLabel =
        minsUntil !== null && minsUntil >= 0 && minsUntil <= 30
          ? minsUntil === 0
            ? 'Starting now'
            : `Starts in ${minsUntil} min`
          : null;

      return {
        id: imminentLabel ? `event-soon-${e.id}` : `event-${e.id}`,
        type: 'calendar_event' as const,
        title: e.title,
        subtitle: imminentLabel
          ? `${imminentLabel}${e.loc ? ` · ${e.loc}` : ''}`
          : e.time
          ? `${e.time}${e.loc ? ` · ${e.loc}` : ''}`
          : e.loc || undefined,
        href: '/calendar',
      };
    })
    .sort((a) => (a.id.startsWith('event-soon') ? -1 : 1));

  // 3. Daily report reminder — only surfaces after 3pm if no report filed today
  const hasReportToday = dailyReports.some((r) => r.date === todayIso);
  const reportNotifications: AppNotification[] =
    !hasReportToday && now.getHours() >= 15
      ? [
          {
            id: 'report-today',
            type: 'report_reminder' as const,
            title: 'Daily Report Pending',
            subtitle: 'Log your momentum for today',
            href: '/',
          },
        ]
      : [];

  return [
    ...overdueNotifications,
    ...eventNotifications,
    ...reportNotifications,
  ];
}
