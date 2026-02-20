import { create } from 'zustand';
import type { AppState, EnergyLevel, Task, User, Toast, RecurringStatus } from '@/types';
import * as db from '@/services/appwriteService';

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

  // Energy
  setEnergy: (level: EnergyLevel) => void;

  // Recurring
  toggleRecurringTask: (id: string) => Promise<void>;

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
  recurringTasks: [],
  energyLevel: null,
  dailyReports: [],
  currentStreak: 0,
  user: null,
  isLoading: true,
  toasts: [],

  // ── Auth ───────────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),

  // ── Tasks ──────────────────────────────────────────────────────────────────
  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = !task.isCompleted;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, isCompleted: next } : t)),
    }));

    if (!appwriteEnabled()) return;
    try {
      await db.updateTask(id, { isCompleted: next });
    } catch (err) {
      console.error('[store] toggleTask:', err);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !next } : t)),
      }));
      get().addToast('error', 'Could not save task update — please retry.');
    }
  },

  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    if (!appwriteEnabled()) return;
    try {
      await db.updateTask(id, updates);
    } catch (err) {
      console.error('[store] updateTask:', err);
      get().addToast('error', 'Could not save task changes.');
    }
  },

  addTask: async (task) => {
    set((s) => ({ tasks: [task, ...s.tasks] }));

    const userId = get().user?.email;
    if (!appwriteEnabled() || !userId) return;
    try {
      await db.createTask(task, userId);
    } catch (err) {
      console.error('[store] addTask:', err);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
      get().addToast('error', 'Could not save new task — please retry.');
    }
  },

  deleteTask: async (id) => {
    const removed = get().tasks.find((t) => t.id === id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));

    if (!appwriteEnabled()) return;
    try {
      await db.deleteTask(id);
    } catch (err) {
      console.error('[store] deleteTask:', err);
      if (removed) set((s) => ({ tasks: [removed, ...s.tasks] }));
      get().addToast('error', 'Could not delete task — please retry.');
    }
  },

  // ── Energy ─────────────────────────────────────────────────────────────────
  setEnergy: (level) => set({ energyLevel: level }),

  // ── Recurring ──────────────────────────────────────────────────────────────
  toggleRecurringTask: async (id) => {
    const rt = get().recurringTasks.find((r) => r.id === id);
    if (!rt) return;
    const next: RecurringStatus = rt.status === 'Completed' ? 'Pending' : 'Completed';

    set((s) => ({
      recurringTasks: s.recurringTasks.map((r) =>
        r.id === id ? { ...r, status: next } : r
      ),
    }));

    if (!appwriteEnabled()) return;
    try {
      await db.updateRecurringTask(id, next);
    } catch (err) {
      console.error('[store] toggleRecurring:', err);
      set((s) => ({
        recurringTasks: s.recurringTasks.map((r) =>
          r.id === id ? { ...r, status: rt.status } : r
        ),
      }));
      get().addToast('error', 'Could not save habit update.');
    }
  },

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
