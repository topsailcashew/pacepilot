import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { AppState } from '@/types';

/**
 * Loads the initial mock data from the public directory and populates the store.
 * In production this would be replaced with a real API call.
 */
export function useDataLoader(): void {
  const { initializeData, setLoading, addToast } = useAppStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Simulate a realistic network delay
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        const res = await fetch('/Mockdata.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Partial<AppState> = await res.json();
        initializeData({ ...data, currentStreak: 12 });
      } catch (err) {
        console.error('[useDataLoader] Failed to load initial data:', err);
        addToast(
          'error',
          'Failed to load app data. Please refresh the page.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
