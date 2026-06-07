import { describe, it, expect, vi, afterEach } from 'vitest';
import { ZONE_RANGES, detectActiveZone } from './zoneDetection';

describe('ZONE_RANGES', () => {
  it('has 5 entries', () => {
    expect(ZONE_RANGES).toHaveLength(5);
  });

  it('covers the expected zones', () => {
    const zones = ZONE_RANGES.map((r) => r.zone);
    expect(zones).toContain('Blue');
    expect(zones).toContain('Green');
    expect(zones).toContain('Grey');
    expect(zones).toContain('Yellow');
    expect(zones).toContain('Red');
  });

  it('each range has start < end', () => {
    ZONE_RANGES.forEach((r) => {
      expect(r.start).toBeLessThan(r.end);
    });
  });
});

describe('detectActiveZone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function fakeHour(hour: number) {
    const d = new Date(2024, 0, 1, hour, 0, 0);
    vi.setSystemTime(d);
  }

  it('returns Blue for hour 5', () => {
    vi.useFakeTimers();
    fakeHour(5);
    expect(detectActiveZone()).toBe('Blue');
  });

  it('returns Green for hour 8', () => {
    vi.useFakeTimers();
    fakeHour(8);
    expect(detectActiveZone()).toBe('Green');
  });

  it('returns Grey for hour 11', () => {
    vi.useFakeTimers();
    fakeHour(11);
    expect(detectActiveZone()).toBe('Grey');
  });

  it('returns Yellow for hour 15', () => {
    vi.useFakeTimers();
    fakeHour(15);
    expect(detectActiveZone()).toBe('Yellow');
  });

  it('returns Red for hour 19', () => {
    vi.useFakeTimers();
    fakeHour(19);
    expect(detectActiveZone()).toBe('Red');
  });

  it('falls back to Green at midnight (hour 0)', () => {
    vi.useFakeTimers();
    fakeHour(0);
    expect(detectActiveZone()).toBe('Green');
  });
});
