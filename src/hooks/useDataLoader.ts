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
} from '@/services/appwriteService';
import { DEMO_USER } from '@/constants';
import type { AppState, User } from '@/types';

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

// ── Appwrite data loader ───────────────────────────────────────────────────────

async function loadAppwriteData(
  initializeData: (data: Partial<AppState>) => void,
  setUser: (user: User | null) => void
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
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Bootstraps app data on mount.
 *
 * When Appwrite is configured (VITE_APPWRITE_PROJECT_ID + VITE_APPWRITE_DATABASE_ID
 * are set) it restores the session and fetches live database data.
 *
 * When Appwrite is NOT configured it falls back to loading /public/Mockdata.json
 * with a demo user so the UI stays fully explorable during local development.
 */
export function useDataLoader(): void {
  const { initializeData, setLoading, setUser, addToast } = useAppStore();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (isAppwriteConfigured()) {
          await loadAppwriteData(initializeData, setUser);
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
