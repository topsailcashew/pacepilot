import { describe, it, expect } from 'vitest';
import { ZONES, ZONE_KEYS, THEME } from './index';
import type { TaskZone } from '@/types';

const EXPECTED_ZONES: TaskZone[] = ['Blue', 'Green', 'Grey', 'Yellow', 'Red'];

describe('ZONES', () => {
  it('has an entry for each TaskZone', () => {
    EXPECTED_ZONES.forEach((z) => {
      expect(ZONES[z]).toBeDefined();
    });
  });

  it('each zone has all required ZoneMeta fields', () => {
    EXPECTED_ZONES.forEach((z) => {
      const meta = ZONES[z];
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.hours).toBeTruthy();
      expect(meta.bg).toBeTruthy();
      expect(meta.text).toBeTruthy();
      expect(meta.border).toBeTruthy();
      expect(meta.chipBg).toBeTruthy();
    });
  });
});

describe('ZONE_KEYS', () => {
  it('has exactly 5 entries', () => {
    expect(ZONE_KEYS).toHaveLength(5);
  });

  it('contains all expected zone keys', () => {
    EXPECTED_ZONES.forEach((z) => {
      expect(ZONE_KEYS).toContain(z);
    });
  });

  it('ZONE_KEYS matches the keys of ZONES', () => {
    const zoneKeys = Object.keys(ZONES) as TaskZone[];
    expect(ZONE_KEYS.sort()).toEqual(zoneKeys.sort());
  });
});

describe('THEME', () => {
  it('has required keys', () => {
    expect(THEME.card).toBeTruthy();
    expect(THEME.buttonPrimary).toBeTruthy();
    expect(THEME.buttonSecondary).toBeTruthy();
    expect(THEME.input).toBeTruthy();
    expect(THEME.label).toBeTruthy();
  });
});
