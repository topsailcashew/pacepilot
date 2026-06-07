/**
 * zoneDetection.ts — time-based zone detection, extracted from WorkdayPage.
 * Pure function; no React dependencies.
 */

import type { TaskZone } from '@/types';

export const ZONE_RANGES: { zone: TaskZone; start: number; end: number }[] = [
  { zone: 'Blue',   start:  4, end:  7 },
  { zone: 'Green',  start:  7, end: 11 },
  { zone: 'Grey',   start: 11, end: 13 },
  { zone: 'Yellow', start: 13, end: 17 },
  { zone: 'Red',    start: 17, end: 24 }, // covers 5 PM → midnight
];

/**
 * Return the active TaskZone for the current hour.
 * Falls back to 'Blue' for early hours (midnight–4 am).
 */
export function detectActiveZone(): TaskZone {
  const hour = new Date().getHours();
  return ZONE_RANGES.find((r) => hour >= r.start && hour < r.end)?.zone ?? 'Blue';
}
