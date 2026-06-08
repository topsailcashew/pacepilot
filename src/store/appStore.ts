import { create } from 'zustand';
import type { AppState, Task, Project, CalendarEvent, User, Toast } from '@/types';
import * as db from '@/services/appwriteService';
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/services/googleCalendarService';
import {
  completeGoogleTask, uncompleteGoogleTask,
  createGoogleTask, updateGoogleTask, deleteGoogleTask,
  createGoogleTaskList, deleteGoogleTaskList,
} from '@/services/googleTasksService';

let toastIdCounter = 0;

interface AppStore extends AppState {
  isLoading: boolean;
  toasts: Toast[];

  // Auth
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;

  // Tasks — optimistic updates, then Appwrite sync
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Projects
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Calendar events
  addCalendarEvent: (event: CalendarEvent) => Promise<void>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // Google sync
  setGoogleAccessToken: (token: string | null) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Bootstrap
  initializeData: (data: Partial<AppState>) => void;
  setLoading: (loading: boolean) => void;

  // Toasts
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const appwriteEnabled = (): boolean =>
  Boolean(
    import.meta.env.VITE_APPWRITE_PROJECT_ID &&
      import.meta.env.VITE_APPWRITE_DATABASE_ID
  );

export const useAppStore = create<AppStore>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  tasks: [],
  projects: [],
  calendarEvents: [],
  dailyReports: [],
  user: null,
  googleAccessToken: null,
  isLoading: true,
  toasts: [],
  theme: 'dark',

  // ── Auth ───────────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),

  // ── Tasks — Google Tasks is the sole source of truth ──────────────────────
  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = !task.isCompleted;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, isCompleted: next } : t)) }));

    const token = get().googleAccessToken;
    const googleId = task.googleTaskId ?? task.id;
    const listId = task.projectId ?? '@default';
    if (!token) return;
    try {
      if (next) await completeGoogleTask(token, googleId, listId);
      else await uncompleteGoogleTask(token, googleId, listId);
    } catch (err) {
      console.error('[store] toggleTask:', err);
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !next } : t)) }));
      get().addToast('error', 'Could not update task in Google Tasks.');
    }
  },

  updateTask: async (id, updates) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
    const token = get().googleAccessToken;
    const task = get().tasks.find((t) => t.id === id);
    if (!token || !task) return;
    const googleId = task.googleTaskId ?? task.id;
    const listId = task.projectId ?? '@default';
    if (updates.title || updates.dueDate !== undefined || updates.zone) {
      updateGoogleTask(
        token, googleId, listId,
        updates.title ?? task.title,
        updates.zone ?? task.zone,
        updates.dueDate,
      ).catch(() => {});
    }
  },

  addTask: async (task) => {
    const token = get().googleAccessToken;
    if (!token) { get().addToast('error', 'Sign in with Google to add tasks.'); return; }

    set((s) => ({ tasks: [task, ...s.tasks] }));
    const listId = task.projectId ?? '@default';
    try {
      const googleTaskId = await createGoogleTask(token, task.title, listId, task.zone, task.dueDate);
      if (googleTaskId) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task.id ? { ...t, id: googleTaskId, googleTaskId } : t
          ),
        }));
      } else {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
        get().addToast('error', 'Could not create task in Google Tasks.');
      }
    } catch (err) {
      console.error('[store] addTask:', err);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
      get().addToast('error', 'Could not save task to Google Tasks.');
    }
  },

  deleteTask: async (id) => {
    const removed = get().tasks.find((t) => t.id === id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    const token = get().googleAccessToken;
    if (!token) return;
    const googleId = removed?.googleTaskId ?? id;
    const listId = removed?.projectId ?? '@default';
    deleteGoogleTask(token, googleId, listId).catch((err) => {
      console.error('[store] deleteTask:', err);
      if (removed) set((s) => ({ tasks: [removed, ...s.tasks] }));
      get().addToast('error', 'Could not delete task from Google Tasks.');
    });
  },

  // ── Projects — Google Task Lists are the source of truth ──────────────────
  addProject: async (project) => {
    const token = get().googleAccessToken;
    if (!token) { get().addToast('error', 'Sign in with Google to add task lists.'); return; }
    set((s) => ({ projects: [...s.projects, project] }));
    try {
      const listId = await createGoogleTaskList(token, project.name);
      if (listId) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === project.id ? { ...p, id: listId, googleListId: listId } : p
          ),
        }));
      } else {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== project.id) }));
        get().addToast('error', 'Could not create list in Google Tasks.');
      }
    } catch (err) {
      console.error('[store] addProject:', err);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== project.id) }));
      get().addToast('error', 'Could not save project — please retry.');
    }
  },

  updateProject: async (id, updates) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
    // Google Tasks API doesn't support renaming lists — update is local only for now
  },

  deleteProject: async (id) => {
    const removed = get().projects.find((p) => p.id === id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    // Also remove tasks belonging to this project from local store
    set((s) => ({ tasks: s.tasks.filter((t) => t.projectId !== id) }));
    const token = get().googleAccessToken;
    const listId = removed?.googleListId ?? id;
    if (token && listId) {
      deleteGoogleTaskList(token, listId).catch((err) => {
        console.error('[store] deleteProject:', err);
        if (removed) set((s) => ({ projects: [...s.projects, removed] }));
        get().addToast('error', 'Could not delete list from Google Tasks.');
      });
    }
  },

  // ── Calendar Events — Google Calendar is the sole source of truth ─────────
  addCalendarEvent: async (event) => {
    const token = get().googleAccessToken;
    if (!token) {
      get().addToast('error', 'Sign in with Google to add events.');
      return;
    }

    // Optimistic local add
    set((s) => ({ calendarEvents: [...s.calendarEvents, event] }));

    try {
      const googleEventId = await createGoogleCalendarEvent(token, event);
      if (googleEventId) {
        set((s) => ({
          calendarEvents: s.calendarEvents.map((e) =>
            e.id === event.id ? { ...e, id: googleEventId, googleEventId } : e
          ),
        }));
      } else {
        set((s) => ({ calendarEvents: s.calendarEvents.filter((e) => e.id !== event.id) }));
        get().addToast('error', 'Could not create event in Google Calendar.');
      }
    } catch (err) {
      console.error('[store] addCalendarEvent:', err);
      set((s) => ({ calendarEvents: s.calendarEvents.filter((e) => e.id !== event.id) }));
      get().addToast('error', 'Could not save event to Google Calendar.');
    }
  },

  updateCalendarEvent: async (id, updates) => {
    set((s) => ({
      calendarEvents: s.calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    // Google Calendar event edits would need a PATCH call — non-critical for now
  },

  deleteCalendarEvent: async (id) => {
    const removed = get().calendarEvents.find((e) => e.id === id);
    set((s) => ({ calendarEvents: s.calendarEvents.filter((e) => e.id !== id) }));

    const token = get().googleAccessToken;
    const googleId = removed?.googleEventId ?? id;
    if (token) {
      deleteGoogleCalendarEvent(token, googleId).catch((err) => {
        console.error('[store] deleteCalendarEvent:', err);
        if (removed) set((s) => ({ calendarEvents: [...s.calendarEvents, removed] }));
        get().addToast('error', 'Could not delete event from Google Calendar.');
      });
    }
  },

  // ── Google sync ────────────────────────────────────────────────────────────
  setGoogleAccessToken: (token) => set({ googleAccessToken: token }),

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  initializeData: (data) => set((s) => ({ ...s, ...data })),
  setLoading: (loading) => set({ isLoading: loading }),

  // ── Toasts ─────────────────────────────────────────────────────────────────
  addToast: (type, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: String(++toastIdCounter), type, message }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
