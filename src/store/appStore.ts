import { create } from 'zustand';
import { AppState, EnergyLevel, Task, User, Toast, RecurringStatus } from '@/types';

let toastIdCounter = 0;

interface AppStore extends AppState {
  /** Loading state for initial data fetch */
  isLoading: boolean;
  /** Toast notifications queue */
  toasts: Toast[];

  // --- Auth actions ---
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;

  // --- Task actions ---
  /** Toggle task completion status */
  toggleTask: (id: string) => void;
  /** Patch a task with partial updates */
  updateTask: (id: string, updates: Partial<Task>) => void;
  /** Prepend a new task to the list */
  addTask: (task: Task) => void;
  /** Remove a task permanently */
  deleteTask: (id: string) => void;

  // --- Energy ---
  setEnergy: (level: EnergyLevel) => void;

  // --- Recurring tasks ---
  toggleRecurringTask: (id: string) => void;

  // --- Initialization ---
  initializeData: (data: Partial<AppState>) => void;
  setLoading: (loading: boolean) => void;

  // --- Toasts ---
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
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

  // Auth
  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  // Tasks
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
      ),
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),

  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  // Energy
  setEnergy: (level) => set({ energyLevel: level }),

  // Recurring
  toggleRecurringTask: (id) =>
    set((state) => ({
      recurringTasks: state.recurringTasks.map((rt) =>
        rt.id === id
          ? {
              ...rt,
              status: (rt.status === 'Completed'
                ? 'Pending'
                : 'Completed') as RecurringStatus,
            }
          : rt
      ),
    })),

  // Initialization
  initializeData: (data) => set((state) => ({ ...state, ...data })),
  setLoading: (loading) => set({ isLoading: loading }),

  // Toasts
  addToast: (type, message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: String(++toastIdCounter), type, message },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
