export type EnergyLevel = 'Low' | 'Medium' | 'High';

export type RecurringInterval = 'Daily' | 'Weekly' | 'Monthly';

export type RecurringStatus = 'Completed' | 'Pending';

export type EisenhowerCategory =
  | 'Urgent & Important'
  | 'Important, Not Urgent'
  | 'Urgent, Not Important'
  | 'Not Urgent, Not Important';

export type MusicGenre = 'Lo-Fi' | 'Jazz' | 'Synth Wave' | 'Chill Trap';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streak: number;
  preferences: {
    startTime: string;
    endTime: string;
    dailyGoal: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  projectId?: string;
  energyRequired: EnergyLevel;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  eisenhower?: EisenhowerCategory;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  color: string;
  time: string;
  loc: string;
}

export interface RecurringTask {
  id: string;
  task: string;
  status: RecurringStatus;
  last: string;
  interval: RecurringInterval;
}

export interface TaskBreakdownItem {
  task: string;
  collaboration: string;
  notes: string;
  timeSpent: string;
}

export interface DailyReport {
  date: string;
  energyLevel: EnergyLevel;
  notes: string;
  momentumScore: number;
  aiInsights: string;
  completedTaskIds: string[];
  goals: string[];
  taskBreakdown: TaskBreakdownItem[];
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  calendarEvents: CalendarEvent[];
  recurringTasks: RecurringTask[];
  energyLevel: EnergyLevel | null;
  dailyReports: DailyReport[];
  currentStreak: number;
  user: User | null;
}

/** Shape of AI task suggestion returned by Gemini */
export interface TaskSuggestion {
  taskId: string;
  reason: string;
  vibeCheck: string;
}

/** Shape of a toast notification */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type NotificationType =
  | 'overdue_task'
  | 'calendar_event'
  | 'habit_due'
  | 'report_reminder';

export interface AppNotification {
  /** Deterministic ID derived from source data — e.g. "overdue-<taskId>". */
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  /** Hash-router path to navigate to on click. */
  href: string;
}
