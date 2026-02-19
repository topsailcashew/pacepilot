
export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface User {
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
  recurringInterval?: 'Daily' | 'Weekly' | 'Monthly';
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
  status: string;
  last: string;
  interval: 'Daily' | 'Weekly' | 'Monthly';
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

export type MusicGenre = 'Lo-Fi' | 'Jazz' | 'Synth Wave' | 'Chill Trap';

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
