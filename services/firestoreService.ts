import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, Project, CalendarEvent, RecurringTask, DailyReport } from '../types';

const COLLECTIONS = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  CALENDAR_EVENTS: 'calendarEvents',
  RECURRING_TASKS: 'recurringTasks',
  DAILY_REPORTS: 'dailyReports',
};

export const firestoreService = {
  // ==================== TASKS ====================

  getTasks: async (userId: string): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  addTask: async (userId: string, task: Omit<Task, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
        ...task,
        userId,
        createdAt: task.createdAt || new Date().toISOString(),
      });
      return { id: docRef.id, ...task };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // ==================== PROJECTS ====================

  getProjects: async (userId: string): Promise<Project[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.PROJECTS), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  },

  addProject: async (userId: string, project: Omit<Project, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
        ...project,
        userId,
      });
      return { id: docRef.id, ...project };
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  updateProject: async (projectId: string, updates: Partial<Project>) => {
    try {
      const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      await updateDoc(projectRef, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // ==================== CALENDAR EVENTS ====================

  getCalendarEvents: async (userId: string): Promise<CalendarEvent[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.CALENDAR_EVENTS), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CalendarEvent));
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  },

  addCalendarEvent: async (userId: string, event: Omit<CalendarEvent, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CALENDAR_EVENTS), {
        ...event,
        userId,
      });
      return { id: docRef.id, ...event };
    } catch (error) {
      console.error('Error adding calendar event:', error);
      throw error;
    }
  },

  updateCalendarEvent: async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
      await updateDoc(eventRef, updates);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  },

  deleteCalendarEvent: async (eventId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId));
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  },

  // ==================== RECURRING TASKS ====================

  getRecurringTasks: async (userId: string): Promise<RecurringTask[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.RECURRING_TASKS), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RecurringTask));
    } catch (error) {
      console.error('Error getting recurring tasks:', error);
      return [];
    }
  },

  updateRecurringTask: async (taskId: string, updates: Partial<RecurringTask>) => {
    try {
      const taskRef = doc(db, COLLECTIONS.RECURRING_TASKS, taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating recurring task:', error);
      throw error;
    }
  },

  // ==================== DAILY REPORTS ====================

  getDailyReports: async (userId: string): Promise<DailyReport[]> => {
    try {
      const q = query(
        collection(db, COLLECTIONS.DAILY_REPORTS),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ ...doc.data() } as DailyReport));
    } catch (error) {
      console.error('Error getting daily reports:', error);
      return [];
    }
  },

  addDailyReport: async (userId: string, report: DailyReport) => {
    try {
      await addDoc(collection(db, COLLECTIONS.DAILY_REPORTS), {
        ...report,
        userId,
      });
    } catch (error) {
      console.error('Error adding daily report:', error);
      throw error;
    }
  },
};
