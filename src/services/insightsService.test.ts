import { describe, it, expect } from 'vitest';
import { computeProjectInsights, computeTaskMomentum } from './insightsService';
import type { Project, Task, DailyReport } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProject(id: string): Project {
  return {
    id,
    name: `Project ${id}`,
    icon: '📁',
    color: 'bg-blue-500',
  };
}

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

function makeDailyReport(date: string, completedTaskIds: string[]): DailyReport {
  return {
    date,
    momentumScore: 80,
    completedTaskIds,
    notes: '',
    aiInsights: '',
    goals: [],
    taskBreakdown: [],
  };
}

// ── computeProjectInsights ────────────────────────────────────────────────────

describe('computeProjectInsights', () => {
  it('returns an insight per project', () => {
    const projects = [makeProject('p1'), makeProject('p2')];
    const result = computeProjectInsights(projects, []);
    expect(result).toHaveLength(2);
  });

  it('computes 0 rate when project has no tasks', () => {
    const [insight] = computeProjectInsights([makeProject('p1')], []);
    expect(insight.rate).toBe(0);
    expect(insight.total).toBe(0);
    expect(insight.completed).toBe(0);
    expect(insight.overdue).toBe(0);
  });

  it('computes correct completion rate', () => {
    const project = makeProject('p1');
    const tasks = [
      makeTask({ id: 't1', projectId: 'p1', isCompleted: true }),
      makeTask({ id: 't2', projectId: 'p1', isCompleted: false }),
      makeTask({ id: 't3', projectId: 'p1', isCompleted: false }),
    ];
    const [insight] = computeProjectInsights([project], tasks);
    expect(insight.total).toBe(3);
    expect(insight.completed).toBe(1);
    expect(insight.rate).toBe(33); // Math.round(1/3*100)
  });

  it('counts overdue tasks correctly', () => {
    const project = makeProject('p1');
    const pastDate = '2020-01-01';
    const futureDate = '2099-12-31';
    const tasks = [
      makeTask({ id: 't1', projectId: 'p1', isCompleted: false, dueDate: pastDate }),
      makeTask({ id: 't2', projectId: 'p1', isCompleted: false, dueDate: futureDate }),
      makeTask({ id: 't3', projectId: 'p1', isCompleted: true, dueDate: pastDate }), // completed overdue — not counted
    ];
    const [insight] = computeProjectInsights([project], tasks);
    expect(insight.overdue).toBe(1);
  });

  it('ignores tasks from other projects', () => {
    const project = makeProject('p1');
    const tasks = [makeTask({ id: 't1', projectId: 'p2', isCompleted: true })];
    const [insight] = computeProjectInsights([project], tasks);
    expect(insight.total).toBe(0);
  });
});

// ── computeTaskMomentum ───────────────────────────────────────────────────────

describe('computeTaskMomentum', () => {
  it('returns zeros when no data', () => {
    const result = computeTaskMomentum([], []);
    expect(result.completedLast7).toBe(0);
    expect(result.completedLast30).toBe(0);
    expect(result.overdueCount).toBe(0);
  });

  it('counts reports within last 7 days', () => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const reports = [makeDailyReport(todayIso, ['t1', 't2'])];
    const result = computeTaskMomentum([], reports);
    expect(result.completedLast7).toBe(2);
  });

  it('excludes reports older than 7 days from completedLast7', () => {
    const old = new Date();
    old.setDate(old.getDate() - 8);
    const oldIso = old.toISOString().split('T')[0];
    const reports = [makeDailyReport(oldIso, ['t1', 't2'])];
    const result = computeTaskMomentum([], reports);
    expect(result.completedLast7).toBe(0);
    expect(result.completedLast30).toBe(2); // within 30 days
  });

  it('counts overdue incomplete tasks', () => {
    const tasks = [
      makeTask({ id: 't1', isCompleted: false, dueDate: '2020-01-01' }),
      makeTask({ id: 't2', isCompleted: true, dueDate: '2020-01-01' }), // completed — not counted
      makeTask({ id: 't3', isCompleted: false, dueDate: '2099-12-31' }), // future — not counted
    ];
    const result = computeTaskMomentum(tasks, []);
    expect(result.overdueCount).toBe(1);
  });
});
