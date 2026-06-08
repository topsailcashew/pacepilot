export type TaskZone = 'Blue' | 'Green' | 'Grey' | 'Yellow' | 'Red';

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
  zone: TaskZone;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
  googleTaskId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  googleListId?: string; // Google Tasks list ID this project syncs with
}

export interface CalendarEvent {
  id: string;
  eventDate: string;
  title: string;
  color: string;
  time: string;
  loc: string;
  googleEventId?: string;
  googleCalendarId?: string; // which Google calendar this came from
}

export interface TaskBreakdownItem {
  task: string;
  collaboration: string;
  notes: string;
  timeSpent: string;
}

export interface DailyReport {
  date: string;
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
  dailyReports: DailyReport[];
  user: User | null;
  googleAccessToken: string | null;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type NotificationType =
  | 'overdue_task'
  | 'calendar_event'
  | 'report_reminder';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  href: string;
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: GmailHeader[];
    mimeType: string;
    body: { data?: string; size: number };
    parts?: GmailMessagePart[];
  };
}

export interface GmailThread {
  id: string;
  snippet: string;
  messages: GmailMessage[];
}

export interface GmailThreadSummary {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  unread: boolean;
}
