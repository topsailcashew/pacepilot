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
} from '@/services/appwriteService';
import {
  getGoogleAccessToken,
  fetchGoogleCalendarEvents,
} from '@/services/googleCalendarService';
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
 * After Appwrite data loads, pull Google Calendar events into Appwrite + the store.
 *
 * Only events that are successfully persisted to Appwrite are added to the
 * local store — this prevents re-attempting the same writes on every page load
 * when the Appwrite schema is not yet configured.
 *
 * All errors are caught and non-fatal: the app continues with Appwrite data.
 */
async function syncWithGoogle(
  data: Partial<AppState>,
  userId: string,
  setGoogleAccessToken: (token: string | null) => void,
  initializeData: (data: Partial<AppState>) => void,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void
): Promise<void> {
  const token = await getGoogleAccessToken();
  if (!token) return; // Email-auth user or scopes not yet granted — skip silently

  setGoogleAccessToken(token);

  // ── Calendar pull ─────────────────────────────────────────────────────────
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const googleEvents = await fetchGoogleCalendarEvents(token, timeMin, timeMax);
    const existingGoogleIds = new Set(
      (data.calendarEvents ?? []).map((e) => e.googleEventId).filter(Boolean)
    );

    const importedEvents: CalendarEvent[] = [];
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

      // Only add to local state if the Appwrite write succeeds.
      // If the schema isn't configured yet (400), skip silently — this prevents
      // the same events being re-attempted on every page load.
      try {
        await createCalendarEvent(newEvent, userId);
        importedEvents.push(newEvent);
      } catch {
        // Schema not ready — skip without adding to store
      }
    }

    // Merge into store state in a single call — no Appwrite or Google side-effects
    if (importedEvents.length > 0) {
      initializeData({
        calendarEvents: [...(data.calendarEvents ?? []), ...importedEvents],
      });
    }
  } catch (err) {
    console.warn('[useDataLoader] Google Calendar sync failed:', err);
    addToast('error', 'Google Calendar sync unavailable — sign out and back in to reconnect.');
  }
}

// ── Appwrite data loader ───────────────────────────────────────────────────────

async function loadAppwriteData(
  initializeData: (data: Partial<AppState>) => void,
  setUser: (user: User | null) => void,
  setGoogleAccessToken: (token: string | null) => void,
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
  syncWithGoogle(data, appUser.$id, setGoogleAccessToken, initializeData, addToast)
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
