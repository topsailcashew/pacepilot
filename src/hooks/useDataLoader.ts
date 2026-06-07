import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  getCurrentUser,
  loadUserData,
  loadUserPreferences,
  saveUserPreferences,
  fetchGoogleAvatar,
  clearAppwriteTasksAndEvents,
  clearAppwriteProjects,
} from '@/services/appwriteService';
import {
  getGoogleAccessToken,
  fetchAllGoogleCalendarEvents,
} from '@/services/googleCalendarService';
import {
  fetchGoogleTaskLists,
  fetchAllGoogleTasks,
} from '@/services/googleTasksService';
import { DEMO_USER } from '@/constants';
import type { AppState, User, CalendarEvent, Task } from '@/types';

// ── Mock data fallback ─────────────────────────────────────────────────────────

async function loadMockData(
  initializeData: (data: Partial<AppState>) => void,
  setUser: (user: User | null) => void
): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  const res = await fetch('/Mockdata.json');
  if (!res.ok) throw new Error(`Mock data fetch failed: HTTP ${res.status}`);
  const data: Partial<AppState> = await res.json();
  initializeData(data);
  setUser(DEMO_USER);
}

// ── Google data loader ────────────────────────────────────────────────────────

/**
 * Load tasks and calendar events exclusively from Google APIs.
 * Appwrite is used only for projects, recurring tasks, reports, and preferences.
 */
async function loadGoogleData(
  token: string,
  userId: string,
  setGoogleAccessToken: (token: string | null) => void,
  initializeData: (data: Partial<AppState>) => void,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void,
): Promise<void> {
  setGoogleAccessToken(token);

  // One-time cleanup: delete old Appwrite tasks, events, and projects (idempotent)
  clearAppwriteTasksAndEvents(userId).catch(() => {});
  clearAppwriteProjects(userId).catch(() => {});

  // ── Load Google Task Lists as Projects ────────────────────────────────────
  let projects: import('@/types').Project[] = [];
  try {
    const lists = await fetchGoogleTaskLists(token);
    // Assign a stable color per list index
    const LIST_COLORS = ['#f37324', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    projects = lists.map((l, i) => ({
      id: l.id,
      name: l.title,
      color: LIST_COLORS[i % LIST_COLORS.length],
      icon: '',
      googleListId: l.id,
    }));
  } catch (err) {
    console.warn('[useDataLoader] Google Task Lists fetch failed:', err);
  }

  // ── Fetch tasks from all Google Task Lists ────────────────────────────────
  let tasks: Task[] = [];
  try {
    const googleTasks = await fetchAllGoogleTasks(token);
    tasks = googleTasks.map((gt) => ({
      id: gt.googleTaskId,
      title: gt.title,
      zone: gt.zone,
      isCompleted: gt.completed,
      createdAt: new Date().toISOString(),
      dueDate: gt.dueDate,
      googleTaskId: gt.googleTaskId,
      projectId: gt.listId,          // list ID = project ID
    }));
  } catch (err) {
    console.warn('[useDataLoader] Google Tasks fetch failed:', err);
    addToast('error', 'Could not load Google Tasks. Check your connection.');
  }

  // ── Fetch events from all Google Calendars ────────────────────────────────
  let calendarEvents: CalendarEvent[] = [];
  try {
    const now = new Date();
    // Show events from 3 months ago through 6 months ahead
    const timeMin = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const googleEvents = await fetchAllGoogleCalendarEvents(token, timeMin, timeMax);
    calendarEvents = googleEvents.map((ge) => ({
      id: ge.googleEventId,         // use googleEventId as local id
      eventDate: ge.eventDate,
      title: ge.title,
      time: ge.time,
      loc: ge.location,
      color: ge.calendarColor,
      googleEventId: ge.googleEventId,
      googleCalendarId: ge.googleCalendarId,
    }));
  } catch (err) {
    console.warn('[useDataLoader] Google Calendar fetch failed:', err);
    addToast('error', 'Could not load Google Calendar. Check your connection.');
  }

  initializeData({ tasks, calendarEvents, projects });
}

// ── Appwrite data loader ───────────────────────────────────────────────────────

async function loadAppwriteData(
  initializeData: (data: Partial<AppState>) => void,
  setUser: (user: User | null) => void,
  setGoogleAccessToken: (token: string | null) => void,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void
): Promise<void> {
  const appUser = await getCurrentUser();
  if (!appUser) return;

  const prefs = await loadUserPreferences();

  let avatar = prefs.avatar;
  if (!avatar) {
    const googleAvatar = await fetchGoogleAvatar();
    if (googleAvatar) {
      avatar = googleAvatar;
      await saveUserPreferences({ ...prefs, avatar }).catch(() => {});
    }
  }

  setUser({
    id: appUser.$id,
    name: appUser.name,
    email: appUser.email,
    avatar,
    streak: prefs.streak,
    preferences: {
      startTime: prefs.startTime,
      endTime: prefs.endTime,
      dailyGoal: prefs.dailyGoal,
    },
  });

  // Load only recurring tasks and reports from Appwrite (projects come from Google Tasks)
  const data = await loadUserData(appUser.$id);
  initializeData({ ...data, tasks: [], calendarEvents: [], projects: [] });

  // Load tasks + events from Google (non-blocking)
  const token = await getGoogleAccessToken();
  if (token) {
    loadGoogleData(token, appUser.$id, setGoogleAccessToken, initializeData, addToast)
      .catch((err) => console.error('[useDataLoader] Google data load error:', err));
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDataLoader(): void {
  const {
    initializeData,
    setLoading,
    setUser,
    addToast,
    setGoogleAccessToken,
  } = useAppStore();

  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      setLoading(true);
      try {
        if (isAppwriteConfigured()) {
          await loadAppwriteData(initializeData, setUser, setGoogleAccessToken, addToast);
        } else {
          await loadMockData(initializeData, setUser);
        }
      } catch (err) {
        console.error('[useDataLoader] Failed to load data:', err);
        addToast('error', 'Failed to load app data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
