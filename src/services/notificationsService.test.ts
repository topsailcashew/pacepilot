import { describe, it, expect } from 'vitest';
import { computeNotifications } from './notificationsService';
import type { Task, CalendarEvent, RecurringTask, DailyReport } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY_ISO = '2024-06-07';
const NOW = new Date(`${TODAY_ISO}T16:00:00.000Z`); // 4pm — after 3pm trigger

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test task',
    zone: 'Green',
    isCompleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Team standup',
    eventDate: TODAY_ISO,
    color: '#F37324',
    time: '09:00',
    loc: '',
    ...overrides,
  };
}

function makeRecurring(overrides: Partial<RecurringTask> = {}): RecurringTask {
  return {
    id: 'rt-1',
    task: 'Morning run',
    status: 'Pending',
    last: '',
    interval: 'Daily',
    ...overrides,
  };
}

function makeDailyReport(date: string): DailyReport {
  return {
    date,
    momentumScore: 80,
    completedTaskIds: [],
    notes: '',
    aiInsights: '',
    goals: [],
    taskBreakdown: [],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeNotifications', () => {
  it('returns empty array when no data', () => {
    const result = computeNotifications([], [], [], [], NOW);
    // Only report reminder may fire — but there's no report and it's after 3pm
    const nonReport = result.filter((n) => n.type !== 'report_reminder');
    expect(nonReport).toHaveLength(0);
  });

  it('generates overdue_task notifications for past-due incomplete tasks', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: '2020-01-01', isCompleted: false }),
      makeTask({ id: 't2', dueDate: '2020-01-01', isCompleted: true }), // completed — skip
      makeTask({ id: 't3', dueDate: '2099-12-31', isCompleted: false }), // future — skip
    ];
    const result = computeNotifications(tasks, [], [], [], NOW);
    const overdue = result.filter((n) => n.type === 'overdue_task');
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe('overdue-t1');
  });

  it('generates calendar_event notifications for today\'s events', () => {
    const events = [
      makeEvent({ id: 'ev1', eventDate: TODAY_ISO }),
      makeEvent({ id: 'ev2', eventDate: '2020-01-01' }), // different day — skip
    ];
    const result = computeNotifications([], events, [], [], NOW);
    const eventNotifs = result.filter((n) => n.type === 'calendar_event');
    expect(eventNotifs).toHaveLength(1);
    expect(eventNotifs[0].id).toBe('event-ev1');
  });

  it('generates habit_due notification when last is empty', () => {
    const rt = makeRecurring({ id: 'rt1', last: '', interval: 'Daily' });
    const result = computeNotifications([], [], [rt], [], NOW);
    const habits = result.filter((n) => n.type === 'habit_due');
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe('habit-rt1');
  });

  it('does not generate habit_due for completed recurring tasks', () => {
    const rt = makeRecurring({ id: 'rt1', status: 'Completed', last: '' });
    const result = computeNotifications([], [], [rt], [], NOW);
    const habits = result.filter((n) => n.type === 'habit_due');
    expect(habits).toHaveLength(0);
  });

  it('generates report_reminder after 3pm when no report today', () => {
    const afterThree = new Date(`${TODAY_ISO}T16:00:00.000Z`);
    const result = computeNotifications([], [], [], [], afterThree);
    const reminder = result.filter((n) => n.type === 'report_reminder');
    expect(reminder).toHaveLength(1);
  });

  it('does NOT generate report_reminder before 3pm', () => {
    const beforeThree = new Date(`${TODAY_ISO}T10:00:00.000Z`);
    const result = computeNotifications([], [], [], [], beforeThree);
    const reminder = result.filter((n) => n.type === 'report_reminder');
    expect(reminder).toHaveLength(0);
  });

  it('does NOT generate report_reminder when report already filed today', () => {
    const reports = [makeDailyReport(TODAY_ISO)];
    const result = computeNotifications([], [], [], reports, NOW);
    const reminder = result.filter((n) => n.type === 'report_reminder');
    expect(reminder).toHaveLength(0);
  });

  it('returns notifications in priority order: overdue → event → habit → report', () => {
    const tasks = [makeTask({ dueDate: '2020-01-01' })];
    const events = [makeEvent()];
    const recurring = [makeRecurring()];
    const result = computeNotifications(tasks, events, recurring, [], NOW);
    const types = result.map((n) => n.type);
    const overdueIdx = types.indexOf('overdue_task');
    const eventIdx = types.indexOf('calendar_event');
    const habitIdx = types.indexOf('habit_due');
    const reportIdx = types.indexOf('report_reminder');
    expect(overdueIdx).toBeLessThan(eventIdx);
    expect(eventIdx).toBeLessThan(habitIdx);
    expect(habitIdx).toBeLessThan(reportIdx);
  });
});
