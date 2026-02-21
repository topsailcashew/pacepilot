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
  RecurringTask,
  DailyReport,
  AppNotification,
} from '@/types';

// ─── Habit due helper ─────────────────────────────────────────────────────────

/**
 * Interpret the RecurringTask.last display string to determine if the habit
 * is due again. The field stores human-readable strings (e.g. "Today", "Last week")
 * in the mock/legacy format, and ISO date strings when written by Appwrite.
 */
function isHabitDue(rt: RecurringTask, now: Date): boolean {
  if (rt.status === 'Completed') return false;
  if (!rt.last?.trim()) return true; // Never completed — always due

  const s = rt.last.toLowerCase().trim();
  let daysSince: number;

  if (s === 'today') {
    daysSince = 0;
  } else if (s === 'yesterday') {
    daysSince = 1;
  } else if (s.includes('last week') || s === 'a week ago') {
    daysSince = 7;
  } else if (s.includes('last month') || s === 'a month ago') {
    daysSince = 30;
  } else {
    const match = s.match(/(\d+)\s+days?\s+ago/);
    if (match) {
      daysSince = parseInt(match[1], 10);
    } else {
      // Fallback: try parsing as an ISO date (used by Appwrite writes)
      const parsed = new Date(rt.last);
      daysSince = isNaN(parsed.getTime())
        ? 999 // Unknown format — treat as overdue to be safe
        : Math.floor((now.getTime() - parsed.getTime()) / 86_400_000);
    }
  }

  const thresholds: Record<string, number> = { Daily: 1, Weekly: 7, Monthly: 30 };
  return daysSince >= (thresholds[rt.interval] ?? 1);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute all active notifications from the current store state.
 * Returns notifications in priority order:
 *   1. Overdue tasks (most urgent)
 *   2. Today's calendar events (time-sensitive)
 *   3. Habits due (actionable)
 *   4. Daily report reminder (lowest urgency, only after 3pm)
 */
export function computeNotifications(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  recurringTasks: RecurringTask[],
  dailyReports: DailyReport[],
  now: Date
): AppNotification[] {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

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

  // 2. Today's calendar events (day-of-month only — matches CalendarPage limitation)
  const eventNotifications: AppNotification[] = calendarEvents
    .filter((e) => e.day === now.getDate())
    .map((e) => ({
      id: `event-${e.id}`,
      type: 'calendar_event' as const,
      title: e.title,
      subtitle: e.time
        ? `${e.time}${e.loc ? ` · ${e.loc}` : ''}`
        : e.loc || undefined,
      href: '/calendar',
    }));

  // 3. Habits due
  const habitNotifications: AppNotification[] = recurringTasks
    .filter((rt) => isHabitDue(rt, now))
    .map((rt) => ({
      id: `habit-${rt.id}`,
      type: 'habit_due' as const,
      title: rt.task,
      subtitle: rt.interval,
      href: '/recurring',
    }));

  // 4. Daily report reminder — only surfaces after 3pm if no report filed today
  const todayIso = now.toISOString().split('T')[0];
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
    ...habitNotifications,
    ...reportNotifications,
  ];
}
