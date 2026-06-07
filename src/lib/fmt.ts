/**
 * fmt.ts — timer display formatting, extracted from FlowTimer.
 * Pure function; no React or DOM dependencies.
 */

/**
 * Convert a total-seconds value into a human-readable timer string.
 * Shows HH:MM:SS when hours > 0, otherwise MM:SS.
 */
export function fmtDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
