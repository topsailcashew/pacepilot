import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  getCurrentUser,
  loadUserData,
  loadUserPreferences,
  saveUserPreferences,
  fetchGoogleAvatar,
  seedDefaultProjects,
  createCalendarEvent,
  updateCalendarEvent,
  updateTask,
} from '@/services/appwriteService';
import {
  getGoogleAccessToken,
  fetchGoogleCalendarEvents,
} from '@/services/googleCalendarService';
import { createGoogleTask } from '@/services/googleTasksService';
import { DEMO_USER } from '@/constants';
import type { AppState, User, CalendarEvent } from '@/types';

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

// ── Google sync ────────────────────────────────────────────────────────────────

/**
 * After Appwrite data loads, pull Google Calendar events into Appwrite and
 * push PacePilot tasks to Google Tasks.
 *
 * - Calendar pull: fetches Google events for the next 60 days; any event not
 *   already tracked by googleEventId is imported into Appwrite + the store.
 * - Tasks push: tasks without a googleTaskId are pushed to Google Tasks; the
 *   returned ID is written back to Appwrite so future syncs skip them.
 *
 * All errors are caught and non-fatal: the app continues with Appwrite data.
 */
async function syncWithGoogle(
  data: Partial<AppState>,
  userId: string,
  setGoogleAccessToken: (token: string | null) => void,
  addCalendarEventToStore: (event: CalendarEvent) => Promise<void>,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void
): Promise<void> {
  const token = await getGoogleAccessToken();
  if (!token) return; // Email-auth user or scopes not yet granted — skip silently

  setGoogleAccessToken(token);

  // ── 1. Calendar pull ────────────────────────────────────────────────────────
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const googleEvents = await fetchGoogleCalendarEvents(token, timeMin, timeMax);
    const existingGoogleIds = new Set(
      (data.calendarEvents ?? []).map((e) => e.googleEventId).filter(Boolean)
    );

    for (const ge of googleEvents) {
      if (existingGoogleIds.has(ge.googleEventId)) continue;

      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        eventDate: ge.eventDate,
        title: ge.title,
        time: ge.time,
        loc: ge.location,
        color: 'bg-blue-500',
        googleEventId: ge.googleEventId,
      };

      // Write to Appwrite directly (bypasses Google push — it came FROM Google)
      await createCalendarEvent(newEvent, userId).catch(() => {/* non-fatal */});
      // Update store optimistically
      await addCalendarEventToStore(newEvent).catch(() => {/* non-fatal */});
    }
  } catch (err) {
    console.warn('[useDataLoader] Google Calendar sync failed:', err);
    addToast('error', 'Google Calendar sync unavailable — sign out and back in to reconnect.');
  }

  // ── 2. Tasks push ───────────────────────────────────────────────────────────
  try {
    const pendingTasks = (data.tasks ?? []).filter(
      (t) => !t.isCompleted && !t.googleTaskId
    );

    for (const t of pendingTasks) {
      const googleTaskId = await createGoogleTask(token, t.title).catch(() => null);
      if (googleTaskId) {
        await updateTask(t.id, { googleTaskId }).catch(() => {/* non-fatal */});
        // Note: store will reflect this on next load; for the current session
        // the task just won't have googleTaskId until refreshed — acceptable.
      }
    }
  } catch (err) {
    console.warn('[useDataLoader] Google Tasks sync failed:', err);
  }
}

// ── Appwrite data loader ───────────────────────────────────────────────────────

async function loadAppwriteData(
  initializeData: (data: Partial<AppState>) => void,
  setUser: (user: User | null) => void,
  setGoogleAccessToken: (token: string | null) => void,
  addCalendarEventToStore: (event: CalendarEvent) => Promise<void>,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void
): Promise<void> {
  const appUser = await getCurrentUser();
  if (!appUser) return; // No active session — login page handles redirect

  const prefs = await loadUserPreferences();

  // On first Google login, prefs.avatar will be empty — pull it from Google
  // and persist it so subsequent loads don't need another API call.
  let avatar = prefs.avatar;
  if (!avatar) {
    const googleAvatar = await fetchGoogleAvatar();
    if (googleAvatar) {
      avatar = googleAvatar;
      await saveUserPreferences({ ...prefs, avatar }).catch(() => {/* non-fatal */});
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

  let data = await loadUserData(appUser.$id);

  // New account — seed default projects
  if (!data.projects?.length) {
    const defaultProjects = await seedDefaultProjects(appUser.$id);
    data = { ...data, projects: defaultProjects };
  }

  initializeData(data);

  // Run Google sync in the background (non-blocking — errors are toasted)
  syncWithGoogle(data, appUser.$id, setGoogleAccessToken, addCalendarEventToStore, addToast)
    .catch((err) => console.error('[useDataLoader] Unexpected sync error:', err));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Bootstraps app data on mount.
 *
 * When Appwrite is configured (VITE_APPWRITE_PROJECT_ID + VITE_APPWRITE_DATABASE_ID
 * are set) it restores the session and fetches live database data, then syncs
 * with Google Calendar / Tasks if the user is signed in with Google.
 *
 * When Appwrite is NOT configured it falls back to loading /public/Mockdata.json
 * with a demo user so the UI stays fully explorable during local development.
 */
export function useDataLoader(): void {
  const {
    initializeData,
    setLoading,
    setUser,
    addToast,
    setGoogleAccessToken,
    addCalendarEvent,
  } = useAppStore();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (isAppwriteConfigured()) {
          await loadAppwriteData(
            initializeData,
            setUser,
            setGoogleAccessToken,
            addCalendarEvent,
            addToast
          );
        } else {
          console.info('[useDataLoader] Appwrite not configured — using mock data.');
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
