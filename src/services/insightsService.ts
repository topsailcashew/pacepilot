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
  /** Total completed tasks in the store */
  totalCompleted: number;
  /** Total incomplete (active) tasks */
  activeCount: number;
  /** Overall completion rate 0–100 */
  completionRate: number;
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
 * Compute task momentum directly from the task list.
 * Uses actual completed/active/overdue counts from the store.
 */
export function computeTaskMomentum(
  tasks: Task[],
  _dailyReports: DailyReport[]
): TaskMomentum {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalCompleted = tasks.filter((t) => t.isCompleted).length;
  const activeCount = tasks.filter((t) => !t.isCompleted).length;
  const total = tasks.length;
  const completionRate = total === 0 ? 0 : Math.round((totalCompleted / total) * 100);

  const overdueCount = tasks.filter(
    (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < today
  ).length;

  return { totalCompleted, activeCount, completionRate, overdueCount };
}
