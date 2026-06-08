import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { getCurrentUser, loadUserData } from '@/services/appwriteService';
import { getGoogleAccessToken } from '@/services/googleCalendarService';

/**
 * In Electron, Google OAuth redirects to pacepilot://auth/callback instead of
 * back to the app URL. The main process catches that deep-link and sends an
 * 'oauth-callback' IPC message to the renderer via window.electronAPI.onOAuthCallback.
 *
 * This hook registers that listener once on mount, then when the callback fires
 * it restores the Appwrite session (the cookie is already set by the redirect)
 * and loads the user's data — exactly what useDataLoader does on a normal web load.
 */
export function useElectronOAuth(): void {
  const { initializeData, setUser, setGoogleAccessToken, setLoading, addToast } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only relevant inside Electron
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).electronAPI;
    if (!api?.onOAuthCallback) return;

    api.onOAuthCallback(async (result: string) => {
      if (result === 'failure') {
        addToast('error', 'Google sign-in failed. Please try again.');
        navigate('/login');
        return;
      }

      // pacepilot://auth/callback — Appwrite has set the session cookie.
      // Load the user just like useDataLoader does on a fresh web page load.
      setLoading(true);
      try {
        const appUser = await getCurrentUser();
        if (!appUser) {
          addToast('error', 'Could not retrieve session after sign-in.');
          navigate('/login');
          return;
        }

        setUser({
          id: appUser.$id,
          name: appUser.name,
          email: appUser.email,
          avatarUrl: null,
        });

        const data = await loadUserData(appUser.$id);
        initializeData(data);

        // Try to get Google access token (non-fatal if missing)
        try {
          const token = await getGoogleAccessToken();
          if (token) setGoogleAccessToken(token);
        } catch {
          // Not fatal — user just won't have Google integrations
        }

        navigate('/');
        addToast('success', `Welcome, ${appUser.name}!`);
      } catch (err) {
        console.error('[useElectronOAuth] Session restore failed:', err);
        addToast('error', 'Sign-in failed. Please try again.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
