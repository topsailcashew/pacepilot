/**
 * insightsService.ts
 *
 * Pure computation of project and task analytics from local store data.
 * No API calls — all results are derived synchronously from the app state.
 */

import type { Project, Task, DailyReport } from '@/types';

export interface ProjectInsight {
  project: Project;
  total: number;
  completed: number;
  /** Completion rate as a value 0–100 */
  rate: number;
  overdue: number;
}

export interface TaskMomentum {
  /** Tasks completed (per daily reports) in the last 7 days */
  completedLast7: number;
  /** Tasks completed (per daily reports) in the last 30 days */
  completedLast30: number;
  /** Tasks with a due date in the past that are still incomplete */
  overdueCount: number;
}

/**
 * Compute per-project completion stats.
 * Overdue = task has a past dueDate and is not completed.
 */
export function computeProjectInsights(
  projects: Project[],
  tasks: Task[]
): ProjectInsight[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const completed = projectTasks.filter((t) => t.isCompleted).length;
    const overdue = projectTasks.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < today
    ).length;
    const total = projectTasks.length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { project, total, completed, rate, overdue };
  });
}

/**
 * Compute task momentum using daily reports (which track completed task IDs
 * per day) and the task list for overdue detection.
 *
 * Note: completedLast7/30 counts report entries — a day's report may
 * reference tasks completed across multiple sessions.
 */
export function computeTaskMomentum(
  tasks: Task[],
  dailyReports: DailyReport[]
): TaskMomentum {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cutoff7 = new Date(today);
  cutoff7.setDate(cutoff7.getDate() - 7);

  const cutoff30 = new Date(today);
  cutoff30.setDate(cutoff30.getDate() - 30);

  const completedLast7 = dailyReports
    .filter((r) => new Date(r.date) >= cutoff7)
    .reduce((sum, r) => sum + (r.completedTaskIds?.length ?? 0), 0);

  const completedLast30 = dailyReports
    .filter((r) => new Date(r.date) >= cutoff30)
    .reduce((sum, r) => sum + (r.completedTaskIds?.length ?? 0), 0);

  const overdueCount = tasks.filter(
    (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < today
  ).length;

  return { completedLast7, completedLast30, overdueCount };
}
